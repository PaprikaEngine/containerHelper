const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export interface PortMapping {
  private_port: number;
  public_port: number | null;
  protocol: string;
}

export interface ContainerInfo {
  id: string;
  name: string;
  image: string;
  state: string;
  status: string;
  created: number;
  ports: PortMapping[];
}

export interface MountInfo {
  source: string;
  destination: string;
  mode: string;
}

export interface ContainerDetail {
  id: string;
  name: string;
  image: string;
  state: string;
  status: string;
  created: number;
  ports: PortMapping[];
  env: string[];
  mounts: MountInfo[];
}

export const containerApi = {
  async listContainers(): Promise<ContainerInfo[]> {
    const response = await fetch(`${API_BASE_URL}/api/containers`);
    if (!response.ok) {
      throw new Error('Failed to fetch containers');
    }
    return response.json();
  },

  async getContainer(id: string): Promise<ContainerDetail> {
    const response = await fetch(`${API_BASE_URL}/api/containers/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch container details');
    }
    return response.json();
  },

  async startContainer(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/containers/${id}/start`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to start container');
    }
  },

  async stopContainer(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/containers/${id}/stop`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to stop container');
    }
  },

  async removeContainer(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/containers/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to remove container');
    }
  },
};
