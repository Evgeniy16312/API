#!/usr/bin/env bash
# Bootstrap МояЗапись on Ubuntu 24.04 VPS
# Usage (on server as root):
#   curl -fsSL ... | bash
#   OR: bash scripts/bootstrap-vps.sh

set -euo pipefail

APP_DIR="${APP_DIR:-/opt/booking-pwa}"
REPO_URL="${REPO_URL:-https://github.com/Evgeniy16312/API.git}"
BRANCH="${BRANCH:-cursor/booking-pwa-mvp-2132}"

echo "==> Updating system"
apt-get update -y
apt-get upgrade -y
apt-get install -y ca-certificates curl git ufw

echo "==> Installing Docker"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable --now docker

echo "==> Firewall"
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable || true

echo "==> Clone / update repo"
mkdir -p /opt
if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR"
  git fetch origin
  git checkout "$BRANCH"
  git pull --ff-only origin "$BRANCH" || true
else
  rm -rf "$APP_DIR"
  git clone --depth 1 --branch "$BRANCH" "$REPO_URL" /opt/api-tmp
  mv /opt/api-tmp/booking-pwa "$APP_DIR"
  rm -rf /opt/api-tmp
fi

cd "$APP_DIR"

if [ ! -f .env.production ]; then
  cp .env.production.example .env.production
  # Temporary until custom domain + HTTPS
  PUBLIC_HOST="${PUBLIC_HOST:-155.212.166.129}"
  sed -i "s|NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=http://${PUBLIC_HOST}|" .env.production
  echo "==> Created .env.production — edit secrets later (nano .env.production)"
fi

# Load NEXT_PUBLIC for build arg
set -a
# shellcheck disable=SC1091
source .env.production
set +a

echo "==> Docker compose build & up"
docker compose up -d --build

echo "==> Done"
docker compose ps
curl -sI "http://127.0.0.1:3000" | head -5 || true
echo ""
echo "Open: http://${PUBLIC_HOST:-155.212.166.129}:3000"
echo "Next: buy/point domain + install Caddy for HTTPS, then MAX webhook."
