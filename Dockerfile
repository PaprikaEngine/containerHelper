# Backend Dockerfile
FROM rust:1.83 as builder

WORKDIR /app

# Copy manifests
COPY Cargo.toml Cargo.lock ./

# Fetch dependencies to cache them as a separate layer
RUN cargo fetch

# Copy source code
COPY src ./src

# Build the application
RUN cargo build --release

# Runtime stage
FROM debian:bookworm-slim

# Create a non-root user and group
RUN groupadd --system --gid 1001 app && useradd --system --uid 1001 --gid app app

WORKDIR /home/app

# Install required dependencies
RUN apt-get update && \
    apt-get install -y ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Copy the binary from builder and set ownership
COPY --from=builder --chown=app:app /app/target/release/container_helper /home/app/container_helper

# Switch to non-root user
USER app

# Expose port
EXPOSE 3001

# Run the binary
CMD ["/home/app/container_helper"]
