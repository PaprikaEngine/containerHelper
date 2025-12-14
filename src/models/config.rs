use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct OsConfig {
    pub os_type: String,
    pub version: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Language {
    pub name: String,
    pub version: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SshConfig {
    pub enabled: bool,
    pub port: u16,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EnvironmentConfig {
    pub name: Option<String>,
    pub os: OsConfig,
    pub languages: Vec<Language>,
    pub ssh: Option<SshConfig>,
}
