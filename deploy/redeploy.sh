#!/usr/bin/env bash
# Build and atomically activate an already-extracted IMN release.
set -Eeuo pipefail

APP_ROOT="/var/www/imn"
RELEASES_DIR="$APP_ROOT/releases"
CURRENT_LINK="$APP_ROOT/current"
RELEASE_DIR="${1:-}"
RELEASE_ID="${2:-unknown}"
ENV_FILE="$APP_ROOT/.env.production"

if [[ -z "$RELEASE_DIR" || ! -d "$RELEASE_DIR" ]]; then
  echo "Usage: $0 /var/www/imn/releases/<release> <release-id>" >&2
  exit 2
fi

RELEASE_DIR="$(realpath "$RELEASE_DIR")"
case "$RELEASE_DIR" in
  "$RELEASES_DIR"/*) ;;
  *)
    echo "Release must be inside $RELEASES_DIR" >&2
    exit 2
    ;;
esac

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing production environment file: $ENV_FILE" >&2
  exit 1
fi

cd "$RELEASE_DIR"
ln -sfn "$ENV_FILE" .env.production

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

echo "==> Installing locked dependencies"
npm ci --include=dev --no-audit --no-fund

echo "==> Generating and validating Prisma client"
npx prisma validate
npx prisma generate

echo "==> Backing up PostgreSQL"
BACKUP_DIR="/var/backups/imn"
sudo install -d -m 700 -o deploy -g deploy "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/predeploy-$(date -u +%Y%m%dT%H%M%SZ)-${RELEASE_ID:0:12}.dump"
pg_dump --format=custom --no-owner --file="$BACKUP_FILE" "$DATABASE_URL"
chmod 600 "$BACKUP_FILE"

echo "==> Applying non-destructive schema synchronization"
npx prisma db push --skip-generate

echo "==> Building production application"
npm run build
test -f .next/standalone/server.js

echo "==> Activating release"
OLD_TARGET="$(readlink -f "$CURRENT_LINK" 2>/dev/null || true)"
rm -f -- "$APP_ROOT/current.next" "$APP_ROOT/current.rollback"
ln -s "$RELEASE_DIR/.next/standalone" "$APP_ROOT/current.next"
mv -Tf "$APP_ROOT/current.next" "$CURRENT_LINK"

sudo install -m 0644 deploy/imn-web.service /etc/systemd/system/imn-web.service
sudo install -m 0644 deploy/imn-email-outbox.service /etc/systemd/system/imn-email-outbox.service
sudo install -m 0644 deploy/imn-email-outbox.timer /etc/systemd/system/imn-email-outbox.timer
sudo systemctl daemon-reload
sudo systemctl enable --now imn-email-outbox.timer
sudo systemctl restart imn-web.service

echo "==> Checking application and database health"
healthy=false
for _ in {1..30}; do
  if curl --fail --silent --show-error --max-time 5 http://127.0.0.1:3000/api/health >/dev/null; then
    healthy=true
    break
  fi
  sleep 2
done

if [[ "$healthy" != true ]]; then
  echo "New release failed health check; rolling back" >&2
  if [[ -n "$OLD_TARGET" && -d "$OLD_TARGET" ]]; then
    ln -s "$OLD_TARGET" "$APP_ROOT/current.rollback"
    mv -Tf "$APP_ROOT/current.rollback" "$CURRENT_LINK"
    sudo systemctl restart imn-web.service
  fi
  exit 1
fi

echo "==> Removing build-only files from this release"
for target in "$RELEASE_DIR/node_modules" "$RELEASE_DIR/.next/cache"; do
  resolved="$(realpath -m "$target")"
  case "$resolved" in
    "$RELEASE_DIR"/*) rm -rf -- "$resolved" ;;
    *) echo "Refusing unsafe cleanup target: $resolved" >&2; exit 1 ;;
  esac
done

echo "==> Pruning old database backups and releases"
mapfile -t old_backups < <(find "$BACKUP_DIR" -maxdepth 1 -type f -name 'predeploy-*.dump' -printf '%T@ %p\n' | sort -rn | awk 'NR > 7 {print $2}')
for target in "${old_backups[@]}"; do
  case "$target" in "$BACKUP_DIR"/*) rm -f -- "$target" ;; esac
done

mapfile -t old_releases < <(find "$RELEASES_DIR" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' | sort -rn | awk 'NR > 3 {print $2}')
for target in "${old_releases[@]}"; do
  resolved="$(realpath -m "$target")"
  case "$resolved" in
    "$RELEASES_DIR"/*) rm -rf -- "$resolved" ;;
    *) echo "Refusing unsafe release cleanup target: $resolved" >&2; exit 1 ;;
  esac
done

echo "==> Release $RELEASE_ID is healthy"
