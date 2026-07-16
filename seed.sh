#!/bin/bash
set -e

DB_NAME="${DB_NAME:-survivor_league}"
DB_USER="${DB_USER:-survivor_app}"
DB_PASS="${DB_PASS:-survivor_app}"

SEED_DIR="$(dirname "$0")/backend/src/main/resources/db"

run_sql() {
    docker compose exec -T mysql mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$1"
}

CHECKPOINT="${1:-}"

echo "Loading base seed data into $DB_NAME..."
for file in "$SEED_DIR"/seed_*.sql; do
    echo "  loading $(basename "$file")..."
    run_sql "$file"
done

if [ -n "$CHECKPOINT" ]; then
    file="$SEED_DIR/checkpoint_${CHECKPOINT}.sql"
    if [ ! -f "$file" ]; then
        echo "Error: checkpoint file not found: $file"
        exit 1
    fi
    echo "Loading checkpoint $CHECKPOINT..."
    run_sql "$file"
fi

echo "Done."
