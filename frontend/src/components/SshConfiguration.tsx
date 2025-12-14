import { Stack, Title, Text, Switch, NumberInput, PasswordInput } from '@mantine/core';
import { IconKey } from '@tabler/icons-react';
import type { SshConfig } from '../types/config';

interface SshConfigurationProps {
  config: SshConfig;
  onConfigChange: (config: SshConfig) => void;
}

export function SshConfiguration({ config, onConfigChange }: SshConfigurationProps) {
  const handleEnabledChange = (enabled: boolean) => {
    onConfigChange({ ...config, enabled });
  };

  const handlePortChange = (port: number | string) => {
    onConfigChange({ ...config, port: Number(port) });
  };

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onConfigChange({ ...config, password: event.currentTarget.value });
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
          />

          <PasswordInput
            label="Root Password"
            description="Password for root user SSH access"
            placeholder="Enter a secure password"
            value={config.password}
            onChange={handlePasswordChange}
            leftSection={<IconKey size={16} />}
            required
          />

          <Text size="sm" c="orange">
            Warning: For production use, consider using SSH key-based authentication instead of password authentication.
          </Text>
        </Stack>
      )}
    </Stack>
  );
}
