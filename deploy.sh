#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/apps/backend/.env"

# Parse flags
BACKEND_ONLY=false
for arg in "$@"; do
  case $arg in
    --backend-only) BACKEND_ONLY=true ;;
  esac
done

set +u
source "$ENV_FILE"
set -u

[[ -z "${DOCKER_ENV:-}" ]] && echo "Missing: DOCKER_ENV" && exit 1
[[ -z "${DOCKER_SERVICES:-}" ]] && echo "Missing: DOCKER_SERVICES" && exit 1
[[ "$BACKEND_ONLY" == false && -z "${LOTTERY_FORWARD_API_PORT:-}" ]] && echo "Missing: LOTTERY_FORWARD_API_PORT" && exit 1

# Backend
COMPOSE_FILES=""
HAS_DATA=false

IFS=',' read -ra SERVICES <<< "$DOCKER_SERVICES"
for SERVICE in "${SERVICES[@]}"; do
  case $SERVICE in
    api)
      COMPOSE_FILES="$COMPOSE_FILES -f $SCRIPT_DIR/apps/backend/docker/docker-compose.yml"
      [[ "$DOCKER_ENV" == "dev" ]] && COMPOSE_FILES="$COMPOSE_FILES -f $SCRIPT_DIR/apps/backend/docker/docker-compose.dev.yml"
      ;;
    data)
      HAS_DATA=true
      COMPOSE_FILES="$COMPOSE_FILES -f $SCRIPT_DIR/apps/backend/docker/docker-compose.data.yml"
      ;;
  esac
done

docker compose --env-file "$ENV_FILE" --project-directory "$SCRIPT_DIR" $COMPOSE_FILES up -d --build

# Run migrations
if [[ "$HAS_DATA" == true ]]; then
  # Local postgres: wait for container to be healthy
  echo "Waiting for postgres to be healthy..."
  POSTGRES_CONTAINER="${COMPOSE_PROJECT_NAME:-lottery}_postgres"

  TIMEOUT=30
  ELAPSED=0
  while [[ $ELAPSED -lt $TIMEOUT ]]; do
    HEALTH=$(docker inspect --format='{{.State.Health.Status}}' "$POSTGRES_CONTAINER" 2>/dev/null || echo "not_found")
    if [[ "$HEALTH" == "healthy" ]]; then
      break
    fi
    sleep 2
    ELAPSED=$((ELAPSED + 2))
  done

  if [[ $ELAPSED -ge $TIMEOUT ]]; then
    echo "Warning: Postgres did not become healthy within ${TIMEOUT}s"
  fi
fi

echo "Running database migrations..."
cd "$SCRIPT_DIR/apps/backend" && pnpm db:migrate

[[ "$BACKEND_ONLY" == true ]] && exit 0

# Frontend
cd "$SCRIPT_DIR/apps/frontend" && pnpm build

FRONTEND_ROOT="$SCRIPT_DIR/apps/frontend/dist"

# Nginx: platform-specific paths
if [[ "$(uname)" == "Darwin" ]]; then
  NGINX_BASE="/opt/homebrew/etc/nginx"
  [[ ! -d "$NGINX_BASE" ]] && NGINX_BASE="/usr/local/etc/nginx"
  LOG_DIR="$NGINX_BASE/logs"
  SUDO=""
  RELOAD_CMD="nginx -s reload"
else
  NGINX_BASE="/etc/nginx"
  LOG_DIR="/var/log/nginx"
  SUDO="sudo"
  RELOAD_CMD="sudo systemctl reload nginx"
fi

NGINX_CONF=$(sed -e "s|__FRONTEND_ROOT__|$FRONTEND_ROOT|g" \
                 -e "s|__API_PORT__|$LOTTERY_FORWARD_API_PORT|g" \
                 -e "s|__LOG_DIR__|$LOG_DIR|g" \
                 "$SCRIPT_DIR/apps/frontend/nginx.conf")

echo "$NGINX_CONF" | $SUDO tee "$NGINX_BASE/sites-available/year-end-party.conf" > /dev/null
[[ ! -L "$NGINX_BASE/sites-enabled/year-end-party.conf" ]] && $SUDO ln -s "$NGINX_BASE/sites-available/year-end-party.conf" "$NGINX_BASE/sites-enabled/"
$SUDO nginx -t && $RELOAD_CMD
