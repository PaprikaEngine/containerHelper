use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;

use crate::models::config::EnvironmentConfig;
use crate::services::dockerfile_generator;

#[derive(Debug, Serialize)]
pub struct DockerfileResponse {
    pub dockerfile: String,
}

#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub error: String,
}

/// POST /api/dockerfile/generate
/// Generate a Dockerfile from the provided configuration
pub async fn generate_dockerfile(
    Json(config): Json<EnvironmentConfig>,
) -> Result<Json<DockerfileResponse>, AppError> {
    tracing::info!("Generating Dockerfile for config: {:?}", config);

    // Validate the configuration
    if config.os.os_type.is_empty() {
        return Err(AppError::BadRequest("OS type is required".to_string()));
    }

    if config.os.version.is_empty() {
        return Err(AppError::BadRequest("OS version is required".to_string()));
    }

    if config.languages.is_empty() {
        return Err(AppError::BadRequest(
            "At least one language is required".to_string(),
        ));
    }

    // Generate the Dockerfile
    let dockerfile = dockerfile_generator::generate_dockerfile(&config);

    tracing::debug!("Generated Dockerfile:\n{}", dockerfile);

    Ok(Json(DockerfileResponse { dockerfile }))
}

// Custom error type for better error handling
#[derive(Debug)]
pub enum AppError {
    BadRequest(String),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            AppError::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg),
        };

        let body = Json(ErrorResponse { error: message });

        (status, body).into_response()
    }
}
