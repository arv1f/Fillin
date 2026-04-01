#!/usr/bin/env bash
set -eu
ROOT="${1:-/opt/fillin-api}"
export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"
if [[ -s "$HOME/.nvm/nvm.sh" ]]; then
  # shellcheck source=/dev/null
  . "$HOME/.nvm/nvm.sh"
fi
if ! command -v npm >/dev/null 2>&1; then
  echo "ERROR: npm not found. Install Node.js 20+ on the server (e.g. apt install nodejs npm, or nvm)."
  exit 127
fi
cd "$ROOT"
if [[ ! -f .env ]]; then
  echo "WARNING: no .env in $ROOT — create DATABASE_URL and ADMIN_TOKEN."
fi
npm ci
npx prisma generate
npx prisma db push
PM2=(pm2)
if ! command -v pm2 >/dev/null 2>&1; then
  PM2=(npx pm2)
fi
if "${PM2[@]}" describe fillin-api >/dev/null 2>&1; then
  "${PM2[@]}" restart fillin-api --update-env
else
  "${PM2[@]}" start ecosystem.config.cjs
fi
"${PM2[@]}" save
echo "remote-api-install.sh OK"
