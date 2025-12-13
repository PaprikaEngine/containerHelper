import React from 'react';
import { Title, Text, Stack, Paper, Code } from '@mantine/core';
import type { EnvironmentConfig } from '../types/config';
import { generateDockerfile } from '../utils/dockerfileGenerator';

interface DockerfilePreviewProps {
  config: EnvironmentConfig;
}

export const DockerfilePreview: React.FC<DockerfilePreviewProps> = ({ config }) => {
  const dockerfile = generateDockerfile(config);

  return (
    <Stack gap="xl">
      <Stack gap="xs">
        <Title order={2}>Preview Dockerfile</Title>
        <Text c="dimmed">
          Review the generated Dockerfile based on your selections.
        </Text>
      </Stack>

      <Paper withBorder p="md" bg="gray.0">
        <Stack gap="sm">
          <Text fw={500} size="sm">Configuration Summary:</Text>
          <div>
            <Text size="sm" c="dimmed">OS: {config.os.type} {config.os.version}</Text>
            <Text size="sm" c="dimmed">
              Languages: {config.languages.map(lang => `${lang.name} ${lang.version}`).join(', ')}
            </Text>
          </div>
        </Stack>
      </Paper>

      <Stack gap="xs">
        <Text fw={500}>Generated Dockerfile:</Text>
        <Code block style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
          {dockerfile}
        </Code>
      </Stack>

      <Paper withBorder p="md" bg="blue.0">
        <Text size="sm">
          You can copy this Dockerfile and use it in your project. Click "Next" to proceed with building the container.
        </Text>
      </Paper>
    </Stack>
  );
};
