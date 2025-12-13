use crate::models::config::{EnvironmentConfig, Language, OsConfig};

pub fn generate_dockerfile(config: &EnvironmentConfig) -> String {
    let mut lines = Vec::new();

    // Generate FROM instruction
    let os_image = get_os_image(&config.os);
    lines.push(format!("FROM {}", os_image));
    lines.push(String::new());

    // Set working directory
    lines.push("WORKDIR /app".to_string());
    lines.push(String::new());

    // Install languages and their dependencies
    for language in &config.languages {
        let language_commands = get_language_install_commands(language, &config.os.os_type);

        if !language_commands.is_empty() {
            lines.push(format!("# Install {} {}", language.name, language.version));
            lines.extend(language_commands);
            lines.push(String::new());
        }
    }

    // Add common helpful commands
    lines.push("# Copy application files".to_string());
    lines.push("# COPY . .".to_string());
    lines.push(String::new());
    lines.push("# Set default command".to_string());
    lines.push("CMD [\"/bin/bash\"]".to_string());

    lines.join("\n")
}

fn get_os_image(os: &OsConfig) -> String {
    match os.os_type.as_str() {
        "ubuntu" => format!("ubuntu:{}", os.version),
        "debian" => format!("debian:{}", os.version),
        "alpine" => "alpine:latest".to_string(),
        _ => "ubuntu:22.04".to_string(),
    }
}

fn get_language_install_commands(language: &Language, os_type: &str) -> Vec<String> {
    let is_alpine = os_type == "alpine";
    let package_manager = if is_alpine { "apk" } else { "apt-get" };
    let update_cmd = if is_alpine {
        "apk update"
    } else {
        "apt-get update"
    };
    let install_flag = if is_alpine { "add" } else { "install -y" };

    match language.name.as_str() {
        "python" => {
            if is_alpine {
                vec![
                    format!("RUN {} && \\", update_cmd),
                    format!(
                        "    {} {} python3 py3-pip && \\",
                        package_manager, install_flag
                    ),
                    "    rm -rf /var/cache/apk/*".to_string(),
                ]
            } else {
                vec![
                    format!("RUN {} && \\", update_cmd),
                    format!(
                        "    {} {} python{} python3-pip && \\",
                        package_manager, install_flag, language.version
                    ),
                    "    rm -rf /var/lib/apt/lists/*".to_string(),
                ]
            }
        }
        "nodejs" => {
            if is_alpine {
                vec![
                    format!("RUN {} && \\", update_cmd),
                    format!("    {} {} nodejs npm && \\", package_manager, install_flag),
                    "    rm -rf /var/cache/apk/*".to_string(),
                ]
            } else {
                vec![
                    format!("RUN {} && \\", update_cmd),
                    format!("    {} {} curl && \\", package_manager, install_flag),
                    format!(
                        "    curl -fsSL https://deb.nodesource.com/setup_{}.x | bash - && \\",
                        language.version
                    ),
                    format!("    {} {} nodejs && \\", package_manager, install_flag),
                    "    rm -rf /var/lib/apt/lists/*".to_string(),
                ]
            }
        }
        "rust" => {
            let nightly_flag = if language.version == "nightly" {
                "--default-toolchain nightly"
            } else {
                ""
            };
            let cleanup = if is_alpine {
                "/var/cache/apk/*"
            } else {
                "/var/lib/apt/lists/*"
            };

            let mut commands = vec![
                format!("RUN {} && \\", update_cmd),
                format!(
                    "    {} {} curl build-essential && \\",
                    package_manager, install_flag
                ),
                format!(
                    "    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y {} && \\",
                    nightly_flag
                ),
                format!("    rm -rf {}", cleanup),
            ];

            commands.push("ENV PATH=\"/root/.cargo/bin:${PATH}\"".to_string());
            commands
        }
        _ => vec![],
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_dockerfile_ubuntu_python() {
        let config = EnvironmentConfig {
            name: Some("test".to_string()),
            os: OsConfig {
                os_type: "ubuntu".to_string(),
                version: "22.04".to_string(),
            },
            languages: vec![Language {
                name: "python".to_string(),
                version: "3.11".to_string(),
            }],
        };

        let dockerfile = generate_dockerfile(&config);
        assert!(dockerfile.contains("FROM ubuntu:22.04"));
        assert!(dockerfile.contains("python3.11"));
        assert!(dockerfile.contains("python3-pip"));
    }

    #[test]
    fn test_generate_dockerfile_alpine_nodejs() {
        let config = EnvironmentConfig {
            name: None,
            os: OsConfig {
                os_type: "alpine".to_string(),
                version: "latest".to_string(),
            },
            languages: vec![Language {
                name: "nodejs".to_string(),
                version: "20".to_string(),
            }],
        };

        let dockerfile = generate_dockerfile(&config);
        assert!(dockerfile.contains("FROM alpine:latest"));
        assert!(dockerfile.contains("apk"));
        assert!(dockerfile.contains("nodejs npm"));
    }

    #[test]
    fn test_generate_dockerfile_multiple_languages() {
        let config = EnvironmentConfig {
            name: None,
            os: OsConfig {
                os_type: "debian".to_string(),
                version: "bookworm".to_string(),
            },
            languages: vec![
                Language {
                    name: "python".to_string(),
                    version: "3.11".to_string(),
                },
                Language {
                    name: "rust".to_string(),
                    version: "stable".to_string(),
                },
            ],
        };

        let dockerfile = generate_dockerfile(&config);
        assert!(dockerfile.contains("FROM debian:bookworm"));
        assert!(dockerfile.contains("python"));
        assert!(dockerfile.contains("rustup"));
    }
}
