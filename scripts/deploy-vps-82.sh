#!/usr/bin/env bash
# Despliegue BocadO en VPS 82.223.54.195 (stack aislado: proyecto docker "bocado")
set -euo pipefail

VPS="${VPS:-root@82.223.54.195}"
DOMAIN="${DOMAIN:-bocado.82-223-54-195.sslip.io}"
PROJECT="${COMPOSE_PROJECT:-bocado}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REMOTE_DIR="${REMOTE_DIR:-/root/comidas}"

echo "→ Sync → $VPS:$REMOTE_DIR"
rsync -az --delete \
  --exclude node_modules --exclude .git --exclude dist \
  --exclude .data --exclude apks --exclude '.env.local' \
  --exclude 'apps/web/.env.local' --exclude '.env.deploy' \
  "$ROOT/" "$VPS:$REMOTE_DIR/"

echo "→ Build + up ($DOMAIN, project=$PROJECT)"
ssh "$VPS" bash -s -- "$DOMAIN" "$PROJECT" "$REMOTE_DIR" <<'REMOTE'
set -euo pipefail
DOMAIN="$1"
PROJECT="$2"
REMOTE_DIR="$3"
cd "$REMOTE_DIR"
chmod +x scripts/vps-proxy-cloudops.sh scripts/deploy-vps-82.sh

touch .env.deploy
chmod 600 .env.deploy
grep -q '^POSTGRES_PASSWORD=' .env.deploy || echo "POSTGRES_PASSWORD=$(openssl rand -hex 24)" >> .env.deploy
grep -q '^SESSION_SECRET=' .env.deploy || echo "SESSION_SECRET=$(openssl rand -hex 32)" >> .env.deploy
grep -q '^ORDER_TOKEN_SECRET=' .env.deploy || echo "ORDER_TOKEN_SECRET=$(openssl rand -hex 32)" >> .env.deploy
grep -q '^ALLOW_ADMIN_REGISTRATION=' .env.deploy || echo "ALLOW_ADMIN_REGISTRATION=false" >> .env.deploy
grep -q '^POSTGRES_PUBLISH_PORT=' .env.deploy || echo "POSTGRES_PUBLISH_PORT=5433" >> .env.deploy
sed -i "s|^DOMAIN=.*||; s|^PUBLIC_APP_URL=.*||" .env.deploy
echo "DOMAIN=$DOMAIN" >> .env.deploy
echo "PUBLIC_APP_URL=https://$DOMAIN" >> .env.deploy
# limpia líneas vacías duplicadas
sed -i '/^$/d' .env.deploy

export COMPOSE_PROJECT_NAME="$PROJECT"
docker compose --project-name "$PROJECT" --env-file .env.deploy build web
# migrate reutiliza la misma imagen
docker tag "${PROJECT}-web:latest" "${PROJECT}-migrate:latest"
docker compose --project-name "$PROJECT" --env-file .env.deploy up -d --no-build

DOMAIN="$DOMAIN" bash scripts/vps-proxy-cloudops.sh

docker compose --project-name "$PROJECT" --env-file .env.deploy ps
echo "--- health ---"
sleep 3
curl -s "http://127.0.0.1:4321/api/health" || true
echo
curl -sI "https://$DOMAIN/carta" | head -5 || curl -sI "http://$DOMAIN/carta" | head -5 || true
df -h / | tail -1
REMOTE

echo "✓ https://${DOMAIN}"
