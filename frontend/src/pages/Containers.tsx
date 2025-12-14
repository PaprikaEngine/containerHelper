import { useEffect, useState } from 'react';
import {
  Container,
  Title,
  Table,
  Badge,
  Button,
  Group,
  TextInput,
  Select,
  Stack,
  ActionIcon,
  Modal,
  Text,
  Alert,
  Code,
} from '@mantine/core';
import { IconRefresh, IconPlayerPlay, IconPlayerPause, IconTrash, IconSearch, IconTerminal, IconKey } from '@tabler/icons-react';
import { containerApi, type ContainerInfo } from '../api/containers';
import { notifications } from '@mantine/notifications';

type FilterState = 'all' | 'running' | 'stopped';

export function Containers() {
  const [containers, setContainers] = useState<ContainerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState<FilterState>('all');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedContainer, setSelectedContainer] = useState<ContainerInfo | null>(null);

  const fetchContainers = async () => {
    try {
      setLoading(true);
      const data = await containerApi.listContainers();
      setContainers(data);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to fetch containers',
        color: 'red',
      });
      console.error('Failed to fetch containers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetching = { current: false };

    const fetchAndPoll = async () => {
      if (fetching.current) return;

      fetching.current = true;
      await fetchContainers();
      fetching.current = false;
    };

    fetchAndPoll(); // Initial fetch
    const interval = setInterval(fetchAndPoll, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStart = async (id: string, name: string) => {
    try {
      await containerApi.startContainer(id);
      notifications.show({
        title: 'Success',
        message: `Container "${name}" started successfully`,
        color: 'green',
      });
      fetchContainers();
    } catch {
      notifications.show({
        title: 'Error',
        message: `Failed to start container "${name}"`,
        color: 'red',
      });
    }
  };

  const handleStop = async (id: string, name: string) => {
    try {
      await containerApi.stopContainer(id);
      notifications.show({
        title: 'Success',
        message: `Container "${name}" stopped successfully`,
        color: 'green',
      });
      fetchContainers();
    } catch {
      notifications.show({
        title: 'Error',
        message: `Failed to stop container "${name}"`,
        color: 'red',
      });
    }
  };

  const handleRemove = async () => {
    if (!selectedContainer) return;

    try {
      await containerApi.removeContainer(selectedContainer.id);
      notifications.show({
        title: 'Success',
        message: `Container "${selectedContainer.name}" removed successfully`,
        color: 'green',
      });
      setDeleteModalOpen(false);
      setSelectedContainer(null);
      fetchContainers();
    } catch {
      notifications.show({
        title: 'Error',
        message: `Failed to remove container "${selectedContainer.name}"`,
        color: 'red',
      });
    }
  };

  const openDeleteModal = (container: ContainerInfo) => {
    setSelectedContainer(container);
    setDeleteModalOpen(true);
  };

  const handleCopyCommand = async (containerId: string, containerName: string) => {
    // Use /bin/sh for Alpine-based images, /bin/bash for others
    const shell = containerName.toLowerCase().includes('alpine') ? '/bin/sh' : '/bin/bash';
    const command = `docker exec -it ${truncateId(containerId)} ${shell}`;

    try {
      await navigator.clipboard.writeText(command);
      notifications.show({
        title: 'Command Copied',
        message: `Exec command copied to clipboard`,
        color: 'blue',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to copy command to clipboard',
        color: 'red',
      });
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const handleCopySSHCommand = async (ports: ContainerInfo['ports']) => {
    // Find SSH port mapping (port 22 in either private or public port)
    const sshPort = ports.find(p => p.private_port === 22 || p.public_port === 22);
    if (!sshPort) return;

    // Determine which port is the host port (the one that's not 22)
    const hostPort = sshPort.private_port === 22 ? sshPort.public_port : sshPort.private_port;
    if (!hostPort) return;

    const command = `ssh -p ${hostPort} root@localhost`;

    try {
      await navigator.clipboard.writeText(command);
      notifications.show({
        title: 'SSH Command Copied',
        message: `SSH connection command copied to clipboard`,
        color: 'blue',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to copy SSH command to clipboard',
        color: 'red',
      });
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const getStateBadgeColor = (state: string) => {
    const lowerState = state.toLowerCase();
    if (lowerState === 'running') return 'green';
    if (lowerState === 'exited') return 'gray';
    if (lowerState === 'paused') return 'yellow';
    return 'blue';
  };

  const filteredContainers = containers
    .filter((container) => {
      // Filter by state
      if (filterState === 'running' && container.state.toLowerCase() !== 'running') {
        return false;
      }
      if (filterState === 'stopped' && container.state.toLowerCase() === 'running') {
        return false;
      }

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          container.name.toLowerCase().includes(query) ||
          container.image.toLowerCase().includes(query) ||
          container.id.toLowerCase().includes(query)
        );
      }

      return true;
    });

  const formatPorts = (ports: ContainerInfo['ports']) => {
    if (!ports || ports.length === 0) return '-';
    return ports
      .map((p) =>
        p.public_port
          ? `${p.public_port}:${p.private_port}/${p.protocol}`
          : `${p.private_port}/${p.protocol}`
      )
      .join(', ');
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return '-';
    return new Date(timestamp * 1000).toLocaleString();
  };

  const truncateId = (id: string) => {
    return id.substring(0, 12);
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <Group justify="space-between">
          <Title order={1}>Docker Containers</Title>
          <Button
            leftSection={<IconRefresh size={16} />}
            onClick={fetchContainers}
            loading={loading}
          >
            Refresh
          </Button>
        </Group>

        <Group>
          <TextInput
            placeholder="Search containers..."
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Select
            value={filterState}
            onChange={(value) => setFilterState((value as FilterState) || 'all')}
            data={[
              { value: 'all', label: 'All Containers' },
              { value: 'running', label: 'Running' },
              { value: 'stopped', label: 'Stopped' },
            ]}
            style={{ width: 200 }}
          />
        </Group>

        {filteredContainers.length === 0 ? (
          <Alert title="No containers found" color="blue">
            {searchQuery || filterState !== 'all'
              ? 'No containers match your filters.'
              : 'No Docker containers found. Create a container using the Dockerfile generator.'}
          </Alert>
        ) : (
          <Table.ScrollContainer minWidth={800}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>ID</Table.Th>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Image</Table.Th>
                  <Table.Th>State</Table.Th>
                  <Table.Th>Ports</Table.Th>
                  <Table.Th>Created</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredContainers.map((container) => (
                  <Table.Tr key={container.id}>
                    <Table.Td>
                      <Code>{truncateId(container.id)}</Code>
                    </Table.Td>
                    <Table.Td>{container.name || '-'}</Table.Td>
                    <Table.Td>{container.image}</Table.Td>
                    <Table.Td>
                      <Badge color={getStateBadgeColor(container.state)}>
                        {container.state}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{formatPorts(container.ports)}</Table.Td>
                    <Table.Td>{formatDate(container.created)}</Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        {container.state.toLowerCase() === 'running' ? (
                          <>
                            <ActionIcon
                              color="blue"
                              variant="light"
                              onClick={() => handleCopyCommand(container.id, container.name)}
                              title="Copy docker exec command"
                            >
                              <IconTerminal size={16} />
                            </ActionIcon>
                            {container.ports.some(p => p.private_port === 22 || p.public_port === 22) && (
                              <ActionIcon
                                color="cyan"
                                variant="light"
                                onClick={() => handleCopySSHCommand(container.ports)}
                                title="Copy SSH connection command"
                              >
                                <IconKey size={16} />
                              </ActionIcon>
                            )}
                            <ActionIcon
                              color="yellow"
                              variant="light"
                              onClick={() => handleStop(container.id, container.name)}
                              title="Stop container"
                            >
                              <IconPlayerPause size={16} />
                            </ActionIcon>
                          </>
                        ) : (
                          <ActionIcon
                            color="green"
                            variant="light"
                            onClick={() => handleStart(container.id, container.name)}
                            title="Start container"
                          >
                            <IconPlayerPlay size={16} />
                          </ActionIcon>
                        )}
                        <ActionIcon
                          color="red"
                          variant="light"
                          onClick={() => openDeleteModal(container)}
                          title="Remove container"
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Stack>

      <Modal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Container Removal"
      >
        <Stack gap="md">
          <Text>
            Are you sure you want to remove the container{' '}
            <strong>{selectedContainer?.name}</strong>?
          </Text>
          <Text size="sm" c="dimmed">
            This action cannot be undone. The container will be permanently deleted.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button color="red" onClick={handleRemove}>
              Remove
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
