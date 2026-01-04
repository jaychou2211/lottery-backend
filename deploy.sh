#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

show_help() {
  echo "Usage: $0 --env=<env> --service=<services> <command> [options]"
  echo ""
  echo "Options:"
  echo "  --env=<env>         Environment: dev or prod"
  echo "  --service=<list>    Services (comma-separated): api, nginx, data"
  echo ""
  echo "Services:"
  echo "  api   - Backend (NestJS)"
  echo "  nginx - Frontend (Nginx + static files)"
  echo "  data  - PostgreSQL"
  echo ""
  echo "Examples:"
  echo "  $0 --env=dev --service=api,data up -d"
  echo "  $0 --env=dev --service=api,data down"
  echo "  $0 --env=dev --service=api,data logs -f"
  echo "  $0 --env=prod --service=api,nginx up -d --build"
  echo "  $0 --env=prod --service=api,nginx,data up -d"
  echo ""
  echo "Note: When 'up' command is used with both 'api' and 'data' services,"
  echo "      database migrations will be automatically executed."
}

ENV=""
SERVICES=""
DOCKER_ARGS=()
HAS_API=false
HAS_DATA=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --env=*)
      ENV="${1#*=}"
      shift
      ;;
    --service=*)
      SERVICES="${1#*=}"
      shift
      ;;
    --help|-h)
      show_help
      exit 0
      ;;
    *)
      DOCKER_ARGS+=("$1")
      shift
      ;;
  esac
done

# Validate environment
if [[ -z "$ENV" ]]; then
  echo "Error: --env is required"
  echo ""
  show_help
  exit 1
fi

if [[ "$ENV" != "dev" && "$ENV" != "prod" ]]; then
  echo "Error: --env must be 'dev' or 'prod'"
  exit 1
fi

# Validate services
if [[ -z "$SERVICES" ]]; then
  echo "Error: --service is required"
  echo ""
  show_help
  exit 1
fi

# Start with base compose file (network)
COMPOSE_FILES="-f $SCRIPT_DIR/docker-compose.yml"

# Parse services
IFS=',' read -ra SERVICE_ARRAY <<< "$SERVICES"

for SERVICE in "${SERVICE_ARRAY[@]}"; do
  case $SERVICE in
    api)
      HAS_API=true
      COMPOSE_FILES="$COMPOSE_FILES -f $SCRIPT_DIR/apps/backend/docker/docker-compose.yml"
      if [[ "$ENV" == "dev" ]]; then
        COMPOSE_FILES="$COMPOSE_FILES -f $SCRIPT_DIR/apps/backend/docker/docker-compose.dev.yml"
      fi
      ;;
    nginx)
      COMPOSE_FILES="$COMPOSE_FILES -f $SCRIPT_DIR/apps/frontend/docker/docker-compose.yml"
      ;;
    data)
      HAS_DATA=true
      COMPOSE_FILES="$COMPOSE_FILES -f $SCRIPT_DIR/apps/backend/docker/docker-compose.data.yml"
      ;;
    *)
      echo "Error: Unknown service '$SERVICE'"
      echo "Valid services: api, nginx, data"
      exit 1
      ;;
  esac
done

# Environment file for variable substitution in compose files
ENV_FILE="$SCRIPT_DIR/apps/backend/.env"

# Execute docker compose with explicit project directory and env file
echo "Running: docker compose --env-file $ENV_FILE --project-directory $SCRIPT_DIR $COMPOSE_FILES ${DOCKER_ARGS[*]}"
docker compose --env-file "$ENV_FILE" --project-directory "$SCRIPT_DIR" $COMPOSE_FILES "${DOCKER_ARGS[@]}"

# Run migrations if 'up' command with api and data services (local dev only)
if [[ "$HAS_API" == true && "$HAS_DATA" == true && "${DOCKER_ARGS[*]}" == *"up"* ]]; then
  echo ""
  echo "=========================================="
  echo "Running database migrations (local)..."
  echo "=========================================="

  # Wait for postgres to be healthy
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  POSTGRES_CONTAINER="${COMPOSE_PROJECT_NAME:-lottery-backend-dev}_postgres"

  echo "Waiting for postgres container to be healthy..."

  TIMEOUT=30
  ELAPSED=0
  while [[ $ELAPSED -lt $TIMEOUT ]]; do
    HEALTH=$(docker inspect --format='{{.State.Health.Status}}' "$POSTGRES_CONTAINER" 2>/dev/null || echo "not_found")
    if [[ "$HEALTH" == "healthy" ]]; then
      echo "Postgres container is healthy."
      break
    fi
    sleep 2
    ELAPSED=$((ELAPSED + 2))
  done

  # Execute migration from local machine (connects to container's PostgreSQL via forwarded port)
  echo ""
  cd "$SCRIPT_DIR/apps/backend" && pnpm db:migrate

  echo ""
  echo "=========================================="
  echo "Migrations completed!"
  echo "=========================================="
fi
