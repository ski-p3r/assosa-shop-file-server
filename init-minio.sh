#!/bin/sh

# Start the MinIO server in the background
minio server /data --console-address ":9001" &

# Wait for MinIO server to start (adjust sleep as needed)
sleep 5

# Configure mc alias (use localhost since running inside the container)
mc alias set myminio http://localhost:9000 minioadmin minioadmin

# Create the uploads bucket if it doesn't exist
mc mb myminio/uploads --ignore-existing

# Set the uploads bucket to public (read-only)
mc anonymous set download myminio/uploads

# Keep the container running by waiting for the MinIO process
wait