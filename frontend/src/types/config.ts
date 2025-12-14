export interface OsConfig {
  type: string;
  version: string;
}

export interface Language {
  name: string;
  version: string;
}

export interface SshConfig {
  enabled: boolean;
  port: number;
  password: string;
}

export interface EnvironmentConfig {
  name?: string;
  os: OsConfig;
  languages: Language[];
  ssh?: SshConfig;
}