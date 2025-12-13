import React, { useState } from 'react';
import { Title, Text, SimpleGrid, Paper, Stack, Group, Button } from '@mantine/core';
import type { OsConfig } from '../types/config';
import { OS_OPTIONS } from '../constants/options';

interface OSSelectionProps {
  selectedOS: OsConfig;
  onOSSelect: (os: OsConfig) => void;
}

export const OSSelection: React.FC<OSSelectionProps> = ({ selectedOS, onOSSelect }) => {
  const [selectedType, setSelectedType] = useState(selectedOS.type);
  const [selectedVersion, setSelectedVersion] = useState(selectedOS.version);

  const handleOSClick = (osType: string) => {
    setSelectedType(osType);
    const osOption = OS_OPTIONS.find(os => os.type === osType);
    if (osOption && osOption.versions.length > 0) {
      const defaultVersion = osOption.versions[0];
      setSelectedVersion(defaultVersion);
      onOSSelect({ type: osType, version: defaultVersion });
    }
  };

  const handleVersionSelect = (version: string) => {
    setSelectedVersion(version);
    onOSSelect({ type: selectedType, version });
  };

  return (
    <Stack gap="xl">
      <Stack gap="xs">
        <Title order={2}>Choose Base OS</Title>
        <Text c="dimmed">Select the operating system for your development environment.</Text>
      </Stack>

      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
        {OS_OPTIONS.map((os) => (
          <Paper
            key={os.type}
            p="md"
            withBorder
            style={{ cursor: 'pointer' }}
            onClick={() => handleOSClick(os.type)}
            bg={selectedType === os.type ? 'blue.0' : 'white'}
            bd={selectedType === os.type ? '1px solid var(--mantine-color-blue-5)' : '1px solid var(--mantine-color-gray-3)'}
          >
            <Stack gap="xs">
              <Text fw={500} size="lg">{os.name}</Text>
              <Text size="sm" c="dimmed">{os.versions.join(', ')}</Text>
            </Stack>
          </Paper>
        ))}
      </SimpleGrid>

      {selectedType && (
        <Stack gap="md">
          <Title order={3}>Select Version</Title>
          <Group gap="xs">
            {OS_OPTIONS.find(os => os.type === selectedType)?.versions.map((version) => (
              <Button
                key={version}
                variant={selectedVersion === version ? 'filled' : 'outline'}
                onClick={() => handleVersionSelect(version)}
                size="sm"
              >
                {version}
              </Button>
            ))}
          </Group>
        </Stack>
      )}
    </Stack>
  );
};