#!/usr/bin/env bash
# Flush outbox + subscriptions + owner alerts (reads key from .env.production).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${ROOT}/.env.production"
BASE_URL="${BACKUP_BASE_URL:-https://myazapis.ru}"
KEY="$(grep -E '^CRON_SECRET=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")"
if [[ -z "$KEY" ]]; then
  KEY="$(grep -E '^ADMIN_SETUP_KEY=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")"
fi
if [[ -z "$KEY" ]]; then
  echo "flush-cron: missing CRON_SECRET / ADMIN_SETUP_KEY" >&2
  exit 1
fi
curl -fsS --max-time 60 -X POST "${BASE_URL}/api/cron/flush" \
  -H "x-admin-key: ${KEY}" >/dev/null
