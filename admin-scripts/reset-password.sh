#!/bin/bash
# Reset a user's password via POST /api/admin/reset-password.
# Run on the machine hosting the stack (e.g. the Pi): ./admin-scripts/reset-password.sh [username]
# Reads APP_ADMIN_KEY from the repo root .env; prompts for the new password (hidden).
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$REPO_ROOT/.env"
URL="${RESET_URL:-http://localhost:3000/api/admin/reset-password}"

ADMIN_KEY=$(grep '^APP_ADMIN_KEY=' "$ENV_FILE" 2>/dev/null | cut -d= -f2- || true)
if [ -z "$ADMIN_KEY" ]; then
    echo "Error: APP_ADMIN_KEY not set in $ENV_FILE"
    exit 1
fi

RESET_USER="${1:-}"
if [ -z "$RESET_USER" ]; then
    read -rp "Username: " RESET_USER
fi

read -rsp "New password for $RESET_USER: " RESET_PW; echo
read -rsp "Confirm new password: " CONFIRM_PW; echo
if [ "$RESET_PW" != "$CONFIRM_PW" ]; then
    echo "Error: passwords don't match"
    exit 1
fi

json_escape() { printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'; }

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$URL" \
    -H "X-Admin-Key: $ADMIN_KEY" -H "Content-Type: application/json" \
    --data-binary @- <<< "{\"username\":\"$(json_escape "$RESET_USER")\",\"newPassword\":\"$(json_escape "$RESET_PW")\"}" \
    || true)

case "$STATUS" in
    204) echo "Password reset for '$RESET_USER'. They've been logged out of all sessions." ;;
    400) echo "Error: username and password can't be blank"; exit 1 ;;
    403) echo "Error: admin key rejected — does the backend's APP_ADMIN_KEY match $ENV_FILE? (restart backend after changing it)"; exit 1 ;;
    404) echo "Error: no user named '$RESET_USER'"; exit 1 ;;
    000) echo "Error: couldn't reach $URL — is the stack running? (docker compose ps)"; exit 1 ;;
    *)   echo "Error: unexpected HTTP $STATUS from $URL"; exit 1 ;;
esac
