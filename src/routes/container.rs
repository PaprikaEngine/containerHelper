use crate::models::container::{ContainerDetail, ContainerInfo};
use crate::services::docker_service::DockerService;
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{delete, get, post},
    Json, Router,
};
use std::sync::Arc;

pub fn container_routes() -> Router<Arc<DockerService>> {
    Router::new()
        .route("/containers", get(list_containers))
        .route("/containers/:id", get(get_container))
        .route("/containers/:id/start", post(start_container))
        .route("/containers/:id/stop", post(stop_container))
        .route("/containers/:id", delete(remove_container))
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
