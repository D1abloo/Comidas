#!/usr/bin/env bash
# SSL + nginx para dominio temporal sslip.io (Let's Encrypt)
set -euo pipefail

DOMAIN="${DOMAIN:-bocado.31-70-114-94.sslip.io}"
EMAIL="${CERTBOT_EMAIL:-admin@bocado.app}"

apt-get update -qq
DEBIAN_FRONTEND=noninteractive apt-get install -y -qq nginx certbot python3-certbot-nginx

cat > /etc/nginx/sites-available/bocado <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

    location / {
        proxy_pass http://127.0.0.1:4321;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_buffering off;
        proxy_read_timeout 86400;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/bocado /etc/nginx/sites-enabled/bocado
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable nginx
systemctl restart nginx

if [ ! -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
  certbot --nginx -d "${DOMAIN}" --non-interactive --agree-tos -m "${EMAIL}" --redirect
else
  certbot renew --quiet || true
fi

systemctl reload nginx
echo "SSL OK: https://${DOMAIN}"
