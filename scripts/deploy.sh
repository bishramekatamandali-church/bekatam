#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"

if [[ ! -f "backend/.env" ]]; then
  echo "Missing backend/.env. Copy backend/.env.example and set DATABASE_URL/JWT_SECRET." >&2
  exit 1
fi

if ! command -v pm2 >/dev/null 2>&1; then
  echo "pm2 is not installed. Install it globally with: npm install -g pm2" >&2
  exit 1
fi

echo "==> Backend install/build"
cd "$ROOT_DIR/backend"
npm install
npm run build
npx prisma generate
npx prisma migrate deploy

echo "==> Frontend install/build"
cd "$ROOT_DIR/frontend"
npm install
npm run build

echo "==> PM2 reload"
cd "$ROOT_DIR"
pm2 startOrReload ecosystem.config.cjs
pm2 save
