use axum::{
    routing::{get, post},
    Router,
};
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod routes;
mod models;
mod services;
mod db;

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "container_helper=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Build our application with routes
    let app = Router::new()
        .route("/health", get(routes::health::health_check))
        .route("/api/dockerfile/generate", post(routes::dockerfile::generate_dockerfile))
        .layer(CorsLayer::permissive());

    // Run it with hyper on 0.0.0.0:3001
    let addr = SocketAddr::from(([0, 0, 0, 0], 3001));
    tracing::info!("Container Helper backend listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}