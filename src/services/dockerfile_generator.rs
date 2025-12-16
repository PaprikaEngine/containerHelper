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

    // Add SSH server if enabled
    if let Some(ssh) = &config.ssh {
        if ssh.enabled {
            let ssh_commands = get_ssh_install_commands(&config.os.os_type);
            lines.push("# Install and configure SSH server".to_string());
            lines.extend(ssh_commands);
            lines.push(String::new());
            lines.push(format!("EXPOSE {}", ssh.port));
            lines.push(String::new());

            // Add entrypoint script to set password at runtime
            lines.push("# Create entrypoint script to set password securely".to_string());
            lines.push("RUN echo '#!/bin/sh' > /entrypoint.sh && \\".to_string());
            lines.push(
                "    echo 'if [ -n \"$ROOT_PASSWORD\" ]; then' >> /entrypoint.sh && \\".to_string(),
            );
            lines.push(
                "    echo '  echo \"root:$ROOT_PASSWORD\" | chpasswd' >> /entrypoint.sh && \\"
                    .to_string(),
            );
            lines.push("    echo 'fi' >> /entrypoint.sh && \\".to_string());
            lines.push("    echo 'exec \"$@\"' >> /entrypoint.sh && \\".to_string());
            lines.push("    chmod +x /entrypoint.sh".to_string());
            lines.push(String::new());
            lines.push("ENTRYPOINT [\"/entrypoint.sh\"]".to_string());
            lines.push(String::new());
        }
    }

    // Add common helpful commands
    lines.push("# Copy application files".to_string());
    lines.push("# COPY . .".to_string());
    lines.push(String::new());
    lines.push("# Set default command".to_string());

    // Use sshd if SSH is enabled, otherwise bash
    if config.ssh.as_ref().is_some_and(|s| s.enabled) {
        lines.push("CMD [\"/usr/sbin/sshd\", \"-D\"]".to_string());
    } else {
        lines.push("CMD [\"/bin/bash\"]".to_string());
    }

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

fn get_ssh_install_commands(os_type: &str) -> Vec<String> {
    let is_alpine = os_type == "alpine";

    if is_alpine {
        vec![
            "RUN apk update && \\".to_string(),
            "    apk add --no-cache openssh && \\".to_string(),
            "    ssh-keygen -A && \\".to_string(),
            "    sed -i \"s/#PermitRootLogin.*/PermitRootLogin yes/\" /etc/ssh/sshd_config && \\".to_string(),
            "    sed -i \"s/#PasswordAuthentication.*/PasswordAuthentication yes/\" /etc/ssh/sshd_config".to_string(),
        ]
    } else {
        // Debian/Ubuntu
        vec![
            "RUN apt-get update && \\".to_string(),
            "    DEBIAN_FRONTEND=noninteractive apt-get install -y openssh-server && \\".to_string(),
            "    mkdir -p /var/run/sshd && \\".to_string(),
            "    sed -i \"s/#\\?PermitRootLogin.*/PermitRootLogin yes/\" /etc/ssh/sshd_config && \\".to_string(),
            "    sed -i \"s/#\\?PasswordAuthentication.*/PasswordAuthentication yes/\" /etc/ssh/sshd_config && \\".to_string(),
            "    rm -rf /var/lib/apt/lists/*".to_string(),
        ]
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
                        "    {} {} software-properties-common && \\",
                        package_manager, install_flag
                    ),
                    "    add-apt-repository ppa:deadsnakes/ppa -y && \\".to_string(),
                    format!("    {} update && \\", package_manager),
                    format!(
                        "    {} {} python{} python{}-pip && \\",
                        package_manager, install_flag, language.version, language.version
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
                        "    curl -fsSL https://deb.nodesource.com/setup_{}.x -o nodesource_setup.sh && \\",
                        language.version
                    ),
                    "    bash nodesource_setup.sh && \\".to_string(),
                    format!("    {} {} nodejs && \\", package_manager, install_flag),
                    "    rm nodesource_setup.sh && \\".to_string(),
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

            let build_tools = if is_alpine {
                "curl gcc musl-dev"
            } else {
                "curl build-essential"
            };

            let mut commands = vec![
                format!("RUN {} && \\", update_cmd),
                format!("    {} {} {} && \\", package_manager, install_flag, build_tools),
                "    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs -o rustup-init.sh && \\".to_string(),
                format!("    sh rustup-init.sh -y {} && \\", nightly_flag),
                "    rm rustup-init.sh && \\".to_string(),
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
            ssh: None,
        };

        let dockerfile = generate_dockerfile(&config);
        assert!(dockerfile.contains("FROM ubuntu:22.04"));
        assert!(dockerfile.contains("python3.11"));
        assert!(dockerfile.contains("python3.11-pip"));
        assert!(dockerfile.contains("deadsnakes"));
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
            ssh: None,
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
            ssh: None,
        };

        let dockerfile = generate_dockerfile(&config);
        assert!(dockerfile.contains("FROM debian:bookworm"));
        assert!(dockerfile.contains("python"));
        assert!(dockerfile.contains("rustup"));
    }
}
