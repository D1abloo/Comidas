#!/usr/bin/env bash
# Solo Postgres BocadO en VPS 82.223.54.195 (la app vive en Vercel).
set -euo pipefail

VPS="${VPS:-root@82.223.54.195}"
PROJECT="${COMPOSE_PROJECT:-bocado}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REMOTE_DIR="${REMOTE_DIR:-/root/comidas}"

echo "→ Sync DB files → $VPS:$REMOTE_DIR"
rsync -az \
  --exclude node_modules --exclude .git --exclude dist \
  --exclude .data --exclude apks --exclude '.env.local' \
  --exclude 'apps/web/.env.local' --exclude '.env.deploy' \
  "$ROOT/docker-compose.yml" "$ROOT/docker" "$ROOT/scripts" \
  "$VPS:$REMOTE_DIR/"

# ensure remote dir layout
ssh "$VPS" "mkdir -p $REMOTE_DIR/docker/postgres"

echo "→ Upsert Postgres only (project=$PROJECT)"
ssh "$VPS" bash -s -- "$PROJECT" "$REMOTE_DIR" <<'REMOTE'
set -euo pipefail
PROJECT="$1"
REMOTE_DIR="$2"
cd "$REMOTE_DIR"
touch .env.deploy
chmod 600 .env.deploy
grep -q '^POSTGRES_PASSWORD=' .env.deploy || echo "POSTGRES_PASSWORD=$(openssl rand -hex 24)" >> .env.deploy
grep -q '^POSTGRES_PUBLISH_PORT=' .env.deploy || echo "POSTGRES_PUBLISH_PORT=5432" >> .env.deploy
# App is on Vercel — do not run web here
sed -i '/^PUBLIC_APP_URL=/d' .env.deploy
echo "PUBLIC_APP_URL=https://bocado-olive.vercel.app" >> .env.deploy
sed -i '/^$/d' .env.deploy

docker compose --project-name "$PROJECT" --env-file .env.deploy up -d postgres
docker compose --project-name "$PROJECT" --env-file .env.deploy stop web migrate 2>/dev/null || true
docker compose --project-name "$PROJECT" --env-file .env.deploy rm -f web migrate 2>/dev/null || true

# Remove leftover BocadO nginx vhost if present
NGINX_CONF=/opt/cloudops/infra/docker/nginx-frontend-ssl.conf
if [ -f "$NGINX_CONF" ] && grep -q BOCADO_VHOST_BEGIN "$NGINX_CONF"; then
  python3 - <<'PY'
from pathlib import Path
p = Path('/opt/cloudops/infra/docker/nginx-frontend-ssl.conf')
text = p.read_text()
begin, end = '# BOCADO_VHOST_BEGIN', '# BOCADO_VHOST_END'
i0, i1 = text.find(begin), text.find(end)
if i0 >= 0 and i1 > i0:
    i1 = text.find('\n', i1) + 1
    new = text[:i0] + text[i1:]
    with p.open('r+') as f:
        f.seek(0); f.write(new); f.truncate()
print('nginx cleaned')
PY
  docker exec cloudops-frontend nginx -t && docker exec cloudops-frontend nginx -s reload || true
fi

docker compose --project-name "$PROJECT" --env-file .env.deploy ps
docker exec "${PROJECT}-postgres-1" pg_isready -U bocado -d bocado
echo "✓ DB only on :${POSTGRES_PUBLISH_PORT:-5432} — app: https://bocado-olive.vercel.app"
REMOTE

echo "✓ Vercel app + VPS Postgres"
