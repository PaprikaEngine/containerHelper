use crate::models::container::{ContainerDetail, ContainerInfo, MountInfo, PortMapping};
use anyhow::Result;
use bollard::container::{
    ListContainersOptions, RemoveContainerOptions, StartContainerOptions, StopContainerOptions,
};
use bollard::Docker;

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
        let status = format!("{} {}", state, state_obj.started_at.unwrap_or_default());

        let created = container
            .created
            .and_then(|c| {
                // Try to parse as RFC3339 datetime
                c.parse::<i64>().ok().or_else(|| {
                    // If that fails, try other formats
                    Some(0)
                })
            })
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
}

impl Default for DockerService {
    fn default() -> Self {
        Self::new().expect("Failed to connect to Docker")
    }
}
