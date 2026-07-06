#!/usr/bin/env bash
# SSL + nginx para dominio temporal sslip.io (Let's Encrypt)
set -euo pipefail

DOMAIN="${DOMAIN:-bocado.31-70-114-94.sslip.io}"
EMAIL="${CERTBOT_EMAIL:-admin@bocado.app}"
CERT_DIR="/etc/letsencrypt/live/${DOMAIN}"

apt-get update -qq
DEBIAN_FRONTEND=noninteractive apt-get install -y -qq nginx certbot python3-certbot-nginx

write_http_only() {
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
}

write_https() {
  cat > /etc/nginx/sites-available/bocado <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name ${DOMAIN};

    ssl_certificate ${CERT_DIR}/fullchain.pem;
    ssl_certificate_key ${CERT_DIR}/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://127.0.0.1:4321;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_buffering off;
        proxy_read_timeout 86400;
    }
}
NGINX
}

ln -sf /etc/nginx/sites-available/bocado /etc/nginx/sites-enabled/bocado
rm -f /etc/nginx/sites-enabled/default

if [ -f "${CERT_DIR}/fullchain.pem" ]; then
  write_https
else
  write_http_only
fi

nginx -t
systemctl enable nginx
systemctl restart nginx

if [ ! -f "${CERT_DIR}/fullchain.pem" ]; then
  certbot --nginx -d "${DOMAIN}" --non-interactive --agree-tos -m "${EMAIL}" --redirect
  write_https
  nginx -t
  systemctl reload nginx
else
  certbot renew --quiet || true
fi

ss -tlnp | grep -E ':443|:80' || true
curl -skI "https://${DOMAIN}/movil" | head -3 || true
echo "SSL OK: https://${DOMAIN}"
