#!/bin/sh

# Start the MinIO server in the background
/usr/bin/minio server /data --console-address ":9001" &

# Wait for MinIO server to start (adjust sleep as needed)
sleep 5

# Configure mc alias (use localhost since running inside the container)
mc alias set myminio http://localhost:9000 minioadmin minioadmin

# Create the uploads bucket if it doesn't exist
mc mb myminio/uploads --ignore-existing

# Create a private policy file for the uploads bucket
cat <<EOF >/tmp/uploads-policy.json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {"AWS": "minioadmin"},
      "Action": ["s3:*"],
      "Resource": ["arn:aws:s3:::uploads/*"]
    }
  ]
}
EOF

# Apply the private policy to the uploads bucket
mc policy set-json /tmp/uploads-policy.json myminio/uploads

# Keep the container running by waiting for the MinIO process
wait