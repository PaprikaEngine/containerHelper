use crate::models::container::{ContainerDetail, ContainerInfo, MountInfo, PortMapping};
use anyhow::Result;
use bollard::container::{
    Config as ContainerConfig, CreateContainerOptions, ListContainersOptions,
    RemoveContainerOptions, StartContainerOptions, StopContainerOptions,
};
use bollard::image::BuildImageOptions;
use bollard::Docker;
use futures_util::stream::StreamExt;
use std::collections::HashMap;

pub struct DockerService {
    docker: Docker,
}

impl DockerService {
    pub fn new() -> Result<Self> {
        let docker = Docker::connect_with_local_defaults()?;
        Ok(Self { docker })
    }

    pub async fn list_containers(&self) -> Result<Vec<ContainerInfo>> {
        let options = Some(ListContainersOptions::<String> {
            all: true,
            ..Default::default()
        });

        let containers = self.docker.list_containers(options).await?;

        let container_infos: Vec<ContainerInfo> = containers
            .into_iter()
            .map(|container| {
                let id = container.id.unwrap_or_default();
                let names = container.names.unwrap_or_default();
                let name = names
                    .first()
                    .map(|n| n.trim_start_matches('/').to_string())
                    .unwrap_or_default();
                let image = container.image.unwrap_or_default();
                let state = container.state.unwrap_or_default();
                let status = container.status.unwrap_or_default();
                let created = container.created.unwrap_or_default();

                let ports: Vec<PortMapping> = container
                    .ports
                    .unwrap_or_default()
                    .into_iter()
                    .map(|port| PortMapping {
                        private_port: port.private_port,
                        public_port: port.public_port,
                        protocol: port
                            .typ
                            .map(|t| t.to_string())
                            .unwrap_or_else(|| "tcp".to_string()),
                    })
                    .collect();

                ContainerInfo {
                    id,
                    name,
                    image,
                    state,
                    status,
                    created,
                    ports,
                }
            })
            .collect();

        Ok(container_infos)
    }

    pub async fn get_container(&self, id: &str) -> Result<ContainerDetail> {
        let container = self.docker.inspect_container(id, None).await?;

        let id = container.id.unwrap_or_default();
        let name = container
            .name
            .unwrap_or_default()
            .trim_start_matches('/')
            .to_string();
        let image = container
            .config
            .as_ref()
            .and_then(|c| c.image.clone())
            .unwrap_or_default();

        let state_obj = container.state.unwrap_or_default();
        let state = state_obj
            .status
            .map(|s| s.to_string())
            .unwrap_or_else(|| "unknown".to_string());
        let status = state.clone();

        let created = container
            .created
            .and_then(|c| c.parse::<chrono::DateTime<chrono::Utc>>().ok())
            .map(|dt| dt.timestamp())
            .unwrap_or_default();

        let ports: Vec<PortMapping> = container
            .network_settings
            .as_ref()
            .and_then(|ns| ns.ports.as_ref())
            .map(|ports_map| {
                ports_map
                    .iter()
                    .flat_map(|(key, port_bindings)| {
                        let parts: Vec<&str> = key.split('/').collect();
                        let private_port = parts[0].parse::<u16>().unwrap_or_default();
                        let protocol = parts.get(1).unwrap_or(&"tcp").to_string();

                        port_bindings
                            .as_ref()
                            .map(|bindings| {
                                bindings
                                    .iter()
                                    .map(|binding| PortMapping {
                                        private_port,
                                        public_port: binding
                                            .host_port
                                            .as_ref()
                                            .and_then(|p| p.parse::<u16>().ok()),
                                        protocol: protocol.clone(),
                                    })
                                    .collect::<Vec<_>>()
                            })
                            .unwrap_or_default()
                    })
                    .collect()
            })
            .unwrap_or_default();

        let env = container
            .config
            .as_ref()
            .and_then(|c| c.env.clone())
            .unwrap_or_default();

        let mounts: Vec<MountInfo> = container
            .mounts
            .unwrap_or_default()
            .into_iter()
            .map(|mount| MountInfo {
                source: mount.source.unwrap_or_default(),
                destination: mount.destination.unwrap_or_default(),
                mode: mount.mode.unwrap_or_default(),
            })
            .collect();

        Ok(ContainerDetail {
            id,
            name,
            image,
            state,
            status,
            created,
            ports,
            env,
            mounts,
        })
    }

    pub async fn start_container(&self, id: &str) -> Result<()> {
        self.docker
            .start_container(id, None::<StartContainerOptions<String>>)
            .await?;
        Ok(())
    }

    pub async fn stop_container(&self, id: &str) -> Result<()> {
        self.docker
            .stop_container(id, None::<StopContainerOptions>)
            .await?;
        Ok(())
    }

    pub async fn remove_container(&self, id: &str) -> Result<()> {
        let options = Some(RemoveContainerOptions {
            force: true,
            ..Default::default()
        });
        self.docker.remove_container(id, options).await?;
        Ok(())
    }

    pub async fn build_image(&self, dockerfile: &str, tag: &str) -> Result<Vec<String>> {
        let build_options = BuildImageOptions {
            t: tag.to_string(),
            rm: true,   // Remove intermediate containers
            pull: true, // Always pull base image
            ..Default::default()
        };

        let dockerfile_tar = self.create_dockerfile_tar(dockerfile)?;

        let mut stream = self
            .docker
            .build_image(build_options, None, Some(dockerfile_tar.into()));

        let mut logs = Vec::new();
        while let Some(build_info) = stream.next().await {
            match build_info {
                Ok(info) => {
                    if let Some(stream) = info.stream {
                        tracing::info!("Build: {}", stream.trim());
                        logs.push(stream);
                    }
                    if let Some(error) = info.error {
                        tracing::error!("Build error: {}", error);
                        return Err(anyhow::anyhow!("Build failed: {}", error));
                    }
                }
                Err(e) => return Err(e.into()),
            }
        }

        Ok(logs)
    }

    pub async fn run_container(
        &self,
        image: &str,
        name: Option<&str>,
        env: Option<Vec<String>>,
        ports: Option<HashMap<String, String>>,
    ) -> Result<String> {
        let mut port_bindings = HashMap::new();
        let mut exposed_ports = HashMap::new();

        if let Some(ports_map) = ports {
            for (container_port, host_port) in ports_map {
                // Docker requires port keys to include protocol (e.g., "8080/tcp")
                let port_key = if container_port.contains('/') {
                    container_port
                } else {
                    format!("{}/tcp", container_port)
                };

                // Add to exposed ports
                exposed_ports.insert(port_key.clone(), HashMap::new());

                // Add to port bindings
                port_bindings.insert(
                    port_key,
                    Some(vec![bollard::service::PortBinding {
                        host_ip: Some("0.0.0.0".to_string()),
                        host_port: Some(host_port),
                    }]),
                );
            }
        }

        let config = ContainerConfig {
            image: Some(image.to_string()),
            env,
            exposed_ports: if exposed_ports.is_empty() {
                None
            } else {
                Some(exposed_ports)
            },
            host_config: Some(bollard::service::HostConfig {
                port_bindings: Some(port_bindings),
                ..Default::default()
            }),
            ..Default::default()
        };

        let options = name.map(|n| CreateContainerOptions {
            name: n.to_string(),
            ..Default::default()
        });

        let container = self.docker.create_container(options, config).await?;

        self.docker
            .start_container(&container.id, None::<StartContainerOptions<String>>)
            .await?;

        Ok(container.id)
    }

    pub async fn is_port_in_use(&self, port: u16) -> Result<bool> {
        let containers = self.list_containers().await?;

        for container in containers {
            // Only check running containers
            if container.state.to_lowercase() != "running" {
                continue;
            }

            for port_mapping in container.ports {
                if let Some(public_port) = port_mapping.public_port {
                    if public_port == port {
                        return Ok(true);
                    }
                }
            }
        }

        Ok(false)
    }

    fn create_dockerfile_tar(&self, dockerfile_content: &str) -> Result<Vec<u8>> {
        use tar::Builder;

        let mut archive = Builder::new(Vec::new());
        let dockerfile_bytes = dockerfile_content.as_bytes();

        let mut header = tar::Header::new_gnu();
        header.set_path("Dockerfile")?;
        header.set_size(dockerfile_bytes.len() as u64);
        header.set_mode(0o644);
        header.set_cksum();

        archive.append(&header, dockerfile_bytes)?;
        archive.finish()?;

        Ok(archive.into_inner()?)
    }
}

impl Default for DockerService {
    fn default() -> Self {
        Self::new().expect("Failed to connect to Docker")
    }
}
