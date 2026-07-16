#!/bin/bash
set -e

DB_NAME="${DB_NAME:-survivor_league}"
DB_USER="${DB_USER:-survivor_app}"
DB_PASS="${DB_PASS:-survivor_app}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../../../.." && pwd)"
COMPOSE_FILE="$REPO_ROOT/docker-compose.yml"

run_sql() {
    docker compose -f "$COMPOSE_FILE" exec -T mysql mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$1"
}

CHECKPOINT="${1:-}"

echo "Loading base seed data into $DB_NAME..."
run_sql "$SCRIPT_DIR/seed_league.sql"

if [ -n "$CHECKPOINT" ]; then
    file="$SCRIPT_DIR/checkpoint_${CHECKPOINT}.sql"
    if [ ! -f "$file" ]; then
        echo "Error: checkpoint file not found: $file"
        exit 1
    fi
    echo "Loading checkpoint $CHECKPOINT..."
    run_sql "$file"
fi

echo "Done. Seeded league 'Season 51 League' with sample players (alex, jordan, sam, casey)."
