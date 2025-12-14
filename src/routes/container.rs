use crate::models::container::{ContainerDetail, ContainerInfo};
use crate::services::docker_service::DockerService;
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;

#[derive(Debug, Deserialize)]
pub struct BuildRequest {
    pub dockerfile: String,
    pub tag: String,
}

#[derive(Debug, Serialize)]
pub struct BuildResponse {
    pub logs: Vec<String>,
    pub tag: String,
}

#[derive(Debug, Deserialize)]
pub struct RunRequest {
    pub image: String,
    pub name: Option<String>,
    pub env: Option<Vec<String>>,
    pub ports: Option<HashMap<String, String>>,
}

#[derive(Debug, Serialize)]
pub struct RunResponse {
    pub container_id: String,
}

pub fn container_routes() -> Router<Arc<DockerService>> {
    Router::new()
        .route("/api/containers", get(list_containers))
        .route(
            "/api/containers/:id",
            get(get_container).delete(remove_container),
        )
        .route("/api/containers/:id/start", post(start_container))
        .route("/api/containers/:id/stop", post(stop_container))
        .route("/api/container/build", post(build_image))
        .route("/api/container/run", post(run_container))
}

async fn list_containers(
    State(docker_service): State<Arc<DockerService>>,
) -> Result<Json<Vec<ContainerInfo>>, (StatusCode, String)> {
    match docker_service.list_containers().await {
        Ok(containers) => Ok(Json(containers)),
        Err(e) => {
            tracing::error!("Failed to list containers: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to list containers: {}", e),
            ))
        }
    }
}

async fn get_container(
    State(docker_service): State<Arc<DockerService>>,
    Path(id): Path<String>,
) -> Result<Json<ContainerDetail>, (StatusCode, String)> {
    match docker_service.get_container(&id).await {
        Ok(container) => Ok(Json(container)),
        Err(e) => {
            tracing::error!("Failed to get container {}: {}", id, e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to get container: {}", e),
            ))
        }
    }
}

async fn start_container(
    State(docker_service): State<Arc<DockerService>>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    match docker_service.start_container(&id).await {
        Ok(_) => (StatusCode::OK, "Container started successfully"),
        Err(e) => {
            tracing::error!("Failed to start container {}: {}", id, e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                "Failed to start container",
            )
        }
    }
}

async fn stop_container(
    State(docker_service): State<Arc<DockerService>>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    match docker_service.stop_container(&id).await {
        Ok(_) => (StatusCode::OK, "Container stopped successfully"),
        Err(e) => {
            tracing::error!("Failed to stop container {}: {}", id, e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                "Failed to stop container",
            )
        }
    }
}

async fn remove_container(
    State(docker_service): State<Arc<DockerService>>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    match docker_service.remove_container(&id).await {
        Ok(_) => (StatusCode::OK, "Container removed successfully"),
        Err(e) => {
            tracing::error!("Failed to remove container {}: {}", id, e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                "Failed to remove container",
            )
        }
    }
}

async fn build_image(
    State(docker_service): State<Arc<DockerService>>,
    Json(request): Json<BuildRequest>,
) -> Result<Json<BuildResponse>, (StatusCode, String)> {
    tracing::info!("Building image with tag: {}", request.tag);

    match docker_service
        .build_image(&request.dockerfile, &request.tag)
        .await
    {
        Ok(logs) => Ok(Json(BuildResponse {
            logs,
            tag: request.tag,
        })),
        Err(e) => {
            tracing::error!("Failed to build image: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to build image: {}", e),
            ))
        }
    }
}

async fn run_container(
    State(docker_service): State<Arc<DockerService>>,
    Json(request): Json<RunRequest>,
) -> Result<Json<RunResponse>, (StatusCode, String)> {
    tracing::info!("Running container from image: {}", request.image);

    match docker_service
        .run_container(
            &request.image,
            request.name.as_deref(),
            request.env,
            request.ports,
        )
        .await
    {
        Ok(container_id) => Ok(Json(RunResponse { container_id })),
        Err(e) => {
            tracing::error!("Failed to run container: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to run container: {}", e),
            ))
        }
    }
}
