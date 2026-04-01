#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-/opt/fillin-api}"
mkdir -p "$ROOT"
TOKEN=$(openssl rand -hex 24)
cat > "$ROOT/.env" << EOF
DATABASE_URL=file:./dev.db
ADMIN_API_PORT=4000
ADMIN_TOKEN=$TOKEN
EOF
chmod 600 "$ROOT/.env"
echo "--- .env created ---"
cat "$ROOT/.env"
