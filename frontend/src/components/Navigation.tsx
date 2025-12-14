import { Group, Button } from '@mantine/core';
import { IconFileCode, IconBox } from '@tabler/icons-react';
import { Link, useLocation } from 'react-router-dom';

export function Navigation() {
  const location = useLocation();

  return (
    <Group justify="center" gap="md" p="md" style={{ borderBottom: '1px solid #dee2e6' }}>
      <Button
        component={Link}
        to="/generator"
        leftSection={<IconFileCode size={16} />}
        variant={location.pathname === '/generator' ? 'filled' : 'light'}
      >
        Dockerfile Generator
      </Button>
      <Button
        component={Link}
        to="/containers"
        leftSection={<IconBox size={16} />}
        variant={location.pathname === '/containers' ? 'filled' : 'light'}
      >
        Container Management
      </Button>
    </Group>
  );
}
