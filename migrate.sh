#!/bin/bash
set -e

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-survivor_league}"
DB_USER="${DB_USER:-survivor_app}"
DB_PASS="${DB_PASS:-survivor_app}"

MIGRATIONS_DIR="$(dirname "$0")/backend/src/main/resources/db/migration"

mysql_cmd() {
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" "$@"
}

echo "Running migrations against $DB_NAME on $DB_HOST:$DB_PORT..."

for file in $(ls "$MIGRATIONS_DIR"/V*.sql | sort -V); do
    echo "  applying $(basename "$file")..."
    mysql_cmd < "$file"
done

echo "Done."
