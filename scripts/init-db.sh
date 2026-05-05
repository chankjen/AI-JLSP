#!/bin/bash
# AI-JLSP Database Initialization Script
# Manually triggers the postgres-init.sql script inside the container

CONTAINER_NAME="ai_jlsp_postgres"
DB_NAME="ai_jlsp"
DB_USER="postgres"

echo "Initializing database..."

# Check if container is running
if [ ! "$(docker ps -q -f name=$CONTAINER_NAME)" ]; then
    echo "Container $CONTAINER_NAME is not running. Starting services..."
    docker-compose up -d postgres
    sleep 5
fi

# Execute the init script
docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME < infrastructure/init-scripts/postgres-init.sql

echo "✅ Database initialized with DPA-compliant schema."
