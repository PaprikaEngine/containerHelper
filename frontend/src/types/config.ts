export interface OsConfig {
  type: string;
  version: string;
}

export interface Language {
  name: string;
  version: string;
}

export interface EnvironmentConfig {
  name?: string;
  os: OsConfig;
  languages: Language[];
}