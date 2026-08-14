#!/usr/bin/env bash
# Trigger in-container SQLite backup via API (F35).
# Usage on VPS cron:
#   15 3 * * * /opt/booking-pwa/scripts/backup-db.sh >> /var/log/moyazapis-backup.log 2>&1
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${ROOT}/.env.production"
BASE_URL="${BACKUP_BASE_URL:-https://myazapis.ru}"

if [[ -f "$ENV_FILE" ]]; then
  KEY="$(grep -E '^CRON_SECRET=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")"
  if [[ -z "$KEY" ]]; then
    KEY="$(grep -E '^ADMIN_SETUP_KEY=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")"
  fi
else
  KEY="${CRON_SECRET:-${ADMIN_SETUP_KEY:-}}"
fi

if [[ -z "${KEY}" ]]; then
  echo "backup-db: missing CRON_SECRET / ADMIN_SETUP_KEY" >&2
  exit 1
fi

curl -fsS --max-time 120 -X POST "${BASE_URL}/api/cron/backup" \
  -H "x-admin-key: ${KEY}" \
  -H "Content-Type: application/json"
echo
