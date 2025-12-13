import type { EnvironmentConfig } from '../types/config';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export interface DockerfileResponse {
  dockerfile: string;
}

export interface ErrorResponse {
  error: string;
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
};
