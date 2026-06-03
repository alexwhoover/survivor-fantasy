#!/bin/bash
set -e

DB_NAME="${DB_NAME:-survivor_league}"
DB_USER="${DB_USER:-survivor_app}"
DB_PASS="${DB_PASS:-survivor_app}"

SEED_DIR="$(dirname "$0")/backend/src/main/resources/db"

echo "Loading seed data into $DB_NAME..."

for file in "$SEED_DIR"/seed_*.sql; do
    echo "  loading $(basename "$file")..."
    docker compose exec -T mysql mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$file"
done

echo "Done."
