#!/usr/bin/env bash
# Despliegue corto: rsync → Docker → SSL (dominio sslip.io)
set -euo pipefail

VPS="${VPS:-root@31.70.114.94}"
DOMAIN="${DOMAIN:-bocado.31-70-114-94.sslip.io}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "→ Sync $ROOT → $VPS:/root/comidas"
rsync -az --delete \
  --exclude node_modules --exclude .git --exclude dist \
  --exclude .data --exclude apks --exclude '.env.local' \
  --exclude 'apps/web/.env.local' --exclude '.env.deploy' \
  "$ROOT/" "$VPS:/root/comidas/"

echo "→ Build + SSL en VPS"
ssh "$VPS" "bash -s" <<REMOTE
set -euo pipefail
cd /root/comidas
DOMAIN="${DOMAIN}"
if [ ! -f .env.deploy ]; then
  echo "SESSION_SECRET=\$(openssl rand -hex 32)" > .env.deploy
fi
grep -q '^DOMAIN=' .env.deploy || echo "DOMAIN=\$DOMAIN" >> .env.deploy
grep -q '^PUBLIC_APP_URL=' .env.deploy || echo "PUBLIC_APP_URL=https://\$DOMAIN" >> .env.deploy
sed -i "s|^PUBLIC_APP_URL=.*|PUBLIC_APP_URL=https://\$DOMAIN|" .env.deploy
sed -i "s|^DOMAIN=.*|DOMAIN=\$DOMAIN|" .env.deploy
source .env.deploy
export SESSION_SECRET PUBLIC_APP_URL DOMAIN BIZUM_COMPANY_PHONE='+34600123456'
docker compose up -d --build
bash scripts/vps-nginx-ssl.sh
docker compose ps
curl -sI "https://\$DOMAIN/movil" | head -5
REMOTE

echo "✓ https://${DOMAIN}"
