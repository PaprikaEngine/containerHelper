import type { EnvironmentConfig } from '../types/config';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export interface DockerfileResponse {
  dockerfile: string;
}

export interface ErrorResponse {
  error: string;
}

export interface BuildResponse {
  logs: string[];
  tag: string;
}

export interface RunOptions {
  name?: string;
  env?: string[];
  ports?: Record<string, string>;
}

export interface RunResponse {
  container_id: string;
}

export class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

export const apiClient = {
  async generateDockerfile(config: EnvironmentConfig): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/api/dockerfile/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: config.name,
        os: {
          os_type: config.os.type,
          version: config.os.version,
        },
        languages: config.languages.map(lang => ({
          name: lang.name,
          version: lang.version,
        })),
        ssh: config.ssh ? {
          enabled: config.ssh.enabled,
          port: config.ssh.port,
          password: config.ssh.password,
        } : undefined,
      }),
    });

    if (!response.ok) {
      const errorData: ErrorResponse = await response.json().catch(() => ({
        error: 'Failed to generate Dockerfile',
      }));
      throw new ApiError(response.status, errorData.error);
    }

    const data: DockerfileResponse = await response.json();
    return data.dockerfile;
  },

  async buildImage(dockerfile: string, tag: string): Promise<BuildResponse> {
    const response = await fetch(`${API_BASE_URL}/api/containers/build`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dockerfile,
        tag,
      }),
    });

    if (!response.ok) {
      const errorData: ErrorResponse = await response.json().catch(() => ({
        error: 'Failed to build image',
      }));
      throw new ApiError(response.status, errorData.error);
    }

    return await response.json();
  },

  async runContainer(image: string, options?: RunOptions): Promise<RunResponse> {
    const response = await fetch(`${API_BASE_URL}/api/containers/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image,
        name: options?.name,
        env: options?.env,
        ports: options?.ports,
      }),
    });

    if (!response.ok) {
      const errorData: ErrorResponse = await response.json().catch(() => ({
        error: 'Failed to run container',
      }));
      throw new ApiError(response.status, errorData.error);
    }

    return await response.json();
  },
};
