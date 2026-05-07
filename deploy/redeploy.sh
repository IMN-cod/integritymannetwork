#!/usr/bin/env bash
# Server-side deploy step — pulls latest, installs, builds, restarts PM2.
# Run from /var/www/imn/integrity-man-network as user "deploy".
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> git pull"
git pull --ff-only

echo "==> npm ci"
npm ci --include=dev

echo "==> prisma generate"
npx prisma generate

echo "==> prisma db push (no destructive changes expected)"
npx prisma db push --skip-generate --accept-data-loss=false || npx prisma db push --skip-generate

echo "==> next build"
npm run build

echo "==> pm2 reload"
pm2 reload deploy/ecosystem.config.cjs --env production --update-env || \
  pm2 start deploy/ecosystem.config.cjs --env production
pm2 save

echo "==> done"
