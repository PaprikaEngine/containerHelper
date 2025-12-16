import { useEffect, useState, useCallback, useRef } from 'react';
import { Stack, Title, Text, Switch, NumberInput, PasswordInput, Textarea, Loader } from '@mantine/core';
import { IconKey, IconAlertCircle, IconLock } from '@tabler/icons-react';
import type { SshConfig } from '../types/config';
import { apiClient } from '../services/api';

interface SshConfigurationProps {
  config: SshConfig;
  onConfigChange: (config: SshConfig) => void;
  onPortValidationChange?: (isValid: boolean) => void;
}

export function SshConfiguration({ config, onConfigChange, onPortValidationChange }: SshConfigurationProps) {
  const [portInUse, setPortInUse] = useState(false);
  const [checkingPort, setCheckingPort] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkPortAvailability = useCallback(async (port: number) => {
    if (!config.enabled) return;

    setCheckingPort(true);
    try {
      const result = await apiClient.checkPort(port);
      setPortInUse(result.in_use);
      onPortValidationChange?.(!result.in_use);
    } catch (error) {
      console.error('Failed to check port:', error);
      setPortInUse(false);
      onPortValidationChange?.(true);
    } finally {
      setCheckingPort(false);
    }
  }, [config.enabled, onPortValidationChange]);

  useEffect(() => {
    if (!config.enabled) {
      setPortInUse(false);
      onPortValidationChange?.(true);
      return;
    }

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      checkPortAvailability(config.port);
    }, 500);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [config.port, config.enabled, checkPortAvailability]);

  const handleEnabledChange = (enabled: boolean) => {
    onConfigChange({ ...config, enabled });
  };

  const handlePortChange = (port: number | string) => {
    onConfigChange({ ...config, port: Number(port) });
  };

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onConfigChange({ ...config, password: event.currentTarget.value });
  };

  const handlePublicKeyChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    onConfigChange({ ...config, publicKey: event.currentTarget.value });
  };

  return (
    <Stack gap="xl">
      <Stack gap="xs">
        <Title order={2}>SSH Server Configuration</Title>
        <Text c="dimmed">
          Enable SSH server for remote access to the container.
        </Text>
      </Stack>

      <Switch
        label="Enable SSH Server"
        description="Allow remote SSH connections to the container"
        checked={config.enabled}
        onChange={(event) => handleEnabledChange(event.currentTarget.checked)}
        size="md"
      />

      {config.enabled && (
        <Stack gap="md">
          <NumberInput
            label="SSH Port"
            description="Port to expose SSH server on the host machine"
            placeholder="2222"
            value={config.port}
            onChange={handlePortChange}
            min={1024}
            max={65535}
            required
            error={portInUse ? 'This port is already in use by another container' : undefined}
            rightSection={checkingPort ? <Loader size="xs" /> : (portInUse ? <IconAlertCircle size={16} color="red" /> : null)}
          />

          <PasswordInput
            label="Root Password"
            description="Password for root user SSH access (minimum 6 characters)"
            placeholder="Enter a secure password (min 6 characters)"
            value={config.password}
            onChange={handlePasswordChange}
            leftSection={<IconKey size={16} />}
            error={config.password.length > 0 && config.password.length < 6 ? 'Password must be at least 6 characters' : undefined}
            required
          />

          <Textarea
            label="SSH Public Key (Optional)"
            description="Add your SSH public key for key-based authentication (e.g., contents of ~/.ssh/id_rsa.pub)"
            placeholder="ssh-rsa AAAA... or ssh-ed25519 AAAA..."
            value={config.publicKey || ''}
            onChange={handlePublicKeyChange}
            leftSection={<IconLock size={16} />}
            minRows={3}
            autosize
          />

          <Text size="sm" c="dimmed">
            Tip: If you provide a public key, you can use key-based authentication which is more secure than password authentication.
          </Text>
        </Stack>
      )}
    </Stack>
  );
}
