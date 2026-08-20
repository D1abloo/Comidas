#!/usr/bin/env bash
# Vhost BocadO en nginx cloudops (80/443 ya ocupados por ese stack).
set -euo pipefail

DOMAIN="${DOMAIN:-bocado.82-223-54-195.sslip.io}"
EMAIL="${CERTBOT_EMAIL:-admin@bocado.app}"
NGINX_CONF="/opt/cloudops/infra/docker/nginx-frontend-ssl.conf"
ACME_DIR="/opt/cloudops/infra/certs/acme-bocado"
CERT_DIR="/opt/cloudops/infra/certs/bocado"
LE_LIVE="/etc/letsencrypt/live/${DOMAIN}"
BEGIN="# BOCADO_VHOST_BEGIN"
END="# BOCADO_VHOST_END"

WEB_NAME="$(docker ps --format '{{.Names}}' | grep -E '^bocado-web' | head -1 || true)"
WEB_NAME="${WEB_NAME:-bocado-web-1}"
docker network connect infra_default "$WEB_NAME" 2>/dev/null || true

mkdir -p "$ACME_DIR/.well-known/acme-challenge" "$CERT_DIR"
apt-get update -qq
DEBIAN_FRONTEND=noninteractive apt-get install -y -qq certbot

# Quitar bloque previo
if grep -q "$BEGIN" "$NGINX_CONF"; then
  sed -i "/$BEGIN/,/$END/d" "$NGINX_CONF"
fi

append_http() {
  cat >> "$NGINX_CONF" <<EOF
$BEGIN
# BocadO aislado (docker project: bocado) — no comparte DB con cloudops/ropa
server {
    listen 80;
    server_name ${DOMAIN};
    location ^~ /.well-known/acme-challenge/ {
        root /etc/nginx/certs/acme-bocado;
        default_type text/plain;
    }
    location / {
        proxy_pass http://${WEB_NAME}:4321;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_buffering off;
        proxy_read_timeout 1h;
    }
}
$END
EOF
}

append_https() {
  cat >> "$NGINX_CONF" <<EOF
$BEGIN
# BocadO aislado (docker project: bocado) — no comparte DB con cloudops/ropa
server {
    listen 80;
    server_name ${DOMAIN};
    location ^~ /.well-known/acme-challenge/ {
        root /etc/nginx/certs/acme-bocado;
        default_type text/plain;
    }
    location / { return 301 https://\$host\$request_uri; }
}
server {
    listen 443 ssl;
    http2 on;
    server_name ${DOMAIN};
    ssl_certificate     /etc/nginx/certs/bocado/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/bocado/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    client_max_body_size 2m;
    location = /api/events/orders {
        proxy_pass http://${WEB_NAME}:4321;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 1h;
    }
    location / {
        proxy_pass http://${WEB_NAME}:4321;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_buffering off;
        proxy_read_timeout 1h;
    }
}
$END
EOF
}

if [ -f "$CERT_DIR/fullchain.pem" ] && [ -f "$CERT_DIR/privkey.pem" ]; then
  append_https
else
  append_http
fi

docker exec cloudops-frontend nginx -t
docker exec cloudops-frontend nginx -s reload

if [ ! -f "$CERT_DIR/fullchain.pem" ]; then
  certbot certonly --webroot -w "$ACME_DIR" -d "$DOMAIN" \
    --non-interactive --agree-tos -m "$EMAIL" || true
  if [ -f "$LE_LIVE/fullchain.pem" ]; then
    cp -L "$LE_LIVE/fullchain.pem" "$CERT_DIR/fullchain.pem"
    cp -L "$LE_LIVE/privkey.pem" "$CERT_DIR/privkey.pem"
    sed -i "/$BEGIN/,/$END/d" "$NGINX_CONF"
    append_https
    docker exec cloudops-frontend nginx -t
    docker exec cloudops-frontend nginx -s reload
  fi
fi

echo "OK ${DOMAIN} → ${WEB_NAME}:4321"
