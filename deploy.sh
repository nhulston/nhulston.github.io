#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

if [[ ! -f .env ]]; then
  echo ".env is missing. Copy .env.example to .env and set real secrets first." >&2
  exit 1
fi

docker compose pull --ignore-pull-failures
docker compose build
docker compose up -d postgres

until docker compose exec -T postgres sh -lc 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"' >/dev/null 2>&1; do
  sleep 1
done

docker compose run --rm backend alembic upgrade head
docker compose up -d --remove-orphans
docker compose ps
