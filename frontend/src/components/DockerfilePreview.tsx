import React, { useEffect, useState } from 'react';
import { Title, Text, Stack, Paper, Code, Loader, Alert, Button, Group, TextInput } from '@mantine/core';
import type { EnvironmentConfig } from '../types/config';
import { apiClient, ApiError } from '../services/api';

interface DockerfilePreviewProps {
  config: EnvironmentConfig;
}

// Sanitize name for Docker (only lowercase alphanumeric, underscore, period, hyphen)
const sanitizeDockerName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_.-]+/g, '-') // Replace invalid chars with hyphen
    .replace(/^[^a-z0-9]+/, '') // Remove leading non-alphanumeric
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
};

export const DockerfilePreview: React.FC<DockerfilePreviewProps> = ({ config }) => {
  const [dockerfile, setDockerfile] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [building, setBuilding] = useState<boolean>(false);
  const [buildLogs, setBuildLogs] = useState<string[]>([]);
  const [builtImageTag, setBuiltImageTag] = useState<string | null>(null);
  const [running, setRunning] = useState<boolean>(false);
  const [containerId, setContainerId] = useState<string | null>(null);
  const [containerName, setContainerName] = useState<string>(
    `${sanitizeDockerName(config.name || 'custom-env')}-container`
  );

  useEffect(() => {
    const fetchDockerfile = async () => {
      setLoading(true);
      setError(null);
      // Reset build/run state when config changes
      setBuilding(false);
      setBuildLogs([]);
      setBuiltImageTag(null);
      setRunning(false);
      setContainerId(null);
      setContainerName(`${sanitizeDockerName(config.name || 'custom-env')}-container`);

      try {
        const result = await apiClient.generateDockerfile(config);
        setDockerfile(result);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError('Failed to generate Dockerfile. Please try again.');
        }
        console.error('Error generating Dockerfile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDockerfile();
  }, [config]);

  const handleBuild = async () => {
    if (!dockerfile) return;

    setBuilding(true);
    setBuildLogs([]);
    setError(null);
    setBuiltImageTag(null);
    setContainerId(null);

    try {
      const tag = `${sanitizeDockerName(config.name || 'custom-env')}:latest`;
      const result = await apiClient.buildImage(dockerfile, tag);
      setBuildLogs(result.logs);
      setBuiltImageTag(result.tag);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to build image. Please try again.');
      }
      console.error('Error building image:', err);
    } finally {
      setBuilding(false);
    }
  };

  const handleRun = async () => {
    if (!builtImageTag) return;

    setRunning(true);
    setError(null);
    setContainerId(null);

    try {
      // Add SSH port mapping if SSH is enabled
      const ports = config.ssh?.enabled && config.ssh.port
        ? { [`${config.ssh.port}`]: '22' }
        : undefined;

      const result = await apiClient.runContainer(builtImageTag, {
        name: containerName,
        ports,
      });
      setContainerId(result.container_id);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to run container. Please try again.');
      }
      console.error('Error running container:', err);
    } finally {
      setRunning(false);
    }
  };

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
            {config.ssh?.enabled && (
              <Text size="sm" c="dimmed">
                SSH Server: Enabled (Port {config.ssh.port})
              </Text>
            )}
          </div>
        </Stack>
      </Paper>

      {loading && (
        <Paper withBorder p="xl">
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text c="dimmed">Generating Dockerfile...</Text>
          </Stack>
        </Paper>
      )}

      {error && (
        <Alert color="red" title="Error">
          {error}
        </Alert>
      )}

      {!loading && !error && dockerfile && (
        <>
          <Stack gap="xs">
            <Text fw={500}>Generated Dockerfile:</Text>
            <Code block style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
              {dockerfile}
            </Code>
          </Stack>

          <Stack gap="md">
            <Group>
              <Button
                onClick={handleBuild}
                loading={building}
                disabled={building || !!builtImageTag}
              >
                {builtImageTag ? 'Image Built' : 'Build Image'}
              </Button>
            </Group>

            {builtImageTag && !containerId && (
              <Stack gap="sm">
                <TextInput
                  label="Container Name"
                  placeholder="my-container"
                  value={containerName}
                  onChange={(event) => setContainerName(event.currentTarget.value)}
                  disabled={running}
                />
                <Group>
                  <Button
                    onClick={handleRun}
                    loading={running}
                    disabled={running || !containerName.trim()}
                    color="green"
                  >
                    Run Container
                  </Button>
                </Group>
              </Stack>
            )}

            {containerId && (
              <Button disabled color="green">
                Container Running
              </Button>
            )}
          </Stack>

          {building && (
            <Paper withBorder p="md" bg="gray.0">
              <Stack gap="sm">
                <Group gap="sm">
                  <Loader size="sm" />
                  <Text fw={500} size="sm">Building image...</Text>
                </Group>
              </Stack>
            </Paper>
          )}

          {buildLogs.length > 0 && (
            <Stack gap="xs">
              <Text fw={500}>Build Logs:</Text>
              <Code block style={{
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                maxHeight: '300px',
                overflowY: 'auto'
              }}>
                {buildLogs.join('')}
              </Code>
            </Stack>
          )}

          {builtImageTag && !containerId && (
            <Alert color="green" title="Build Successful">
              Image built successfully: {builtImageTag}
            </Alert>
          )}

          {containerId && (
            <Alert color="green" title="Container Running">
              Container started successfully with ID: {containerId}
            </Alert>
          )}

          {!builtImageTag && !building && (
            <Paper withBorder p="md" bg="blue.0">
              <Text size="sm">
                Click "Build Image" to build a Docker image from this Dockerfile.
              </Text>
            </Paper>
          )}
        </>
      )}
    </Stack>
  );
};
