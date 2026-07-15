#!/bin/bash
set -euo pipefail

DOMAIN="clock.petralian.com"
WEBROOT="/www/wwwroot/${DOMAIN}"
NGINX_CONF="/www/server/panel/vhost/nginx/${DOMAIN}.conf"
WELLKNOWN="/www/server/panel/vhost/nginx/well-known/${DOMAIN}.conf"
CERT_DIR="/www/server/panel/vhost/cert/${DOMAIN}"

mkdir -p "$WEBROOT"
chown -R www:www "$WEBROOT"

# HTTP-only bootstrap for ACME (before cert exists)
cat > "$NGINX_CONF" <<'EOF'
server {
    listen 80;
    server_name clock.petralian.com;
    root /www/wwwroot/clock.petralian.com;
    index index.html;

    include /www/server/panel/vhost/nginx/well-known/clock.petralian.com.conf;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~ \.well-known {
        allow all;
    }

    access_log /www/wwwlogs/clock.petralian.com.log;
    error_log  /www/wwwlogs/clock.petralian.com.error.log;
}
EOF

cp /www/server/panel/vhost/nginx/well-known/crm.petralian.com.conf "$WELLKNOWN"

nginx -t
systemctl reload nginx

# Issue Let's Encrypt cert via aaPanel acme_v2 (HTTP file validation)
cd /www/server/panel
/www/server/panel/pyenv/bin/python <<'PY'
import sys, os
os.chdir('/www/server/panel')
sys.path.insert(0, 'class/')
import public
from acme_v2 import acme_v2

domain = 'clock.petralian.com'
acme = acme_v2()
result = acme.apply_cert_domain([domain], auth_to=domain, auth_type='http')
print('ACME_RESULT:', result)
if not result.get('status', True):
    raise SystemExit(1)
PY

mkdir -p "$CERT_DIR"
# acme_v2 stores certs under panel ssl dir; deploy copies to vhost cert path
if [ -d "/www/server/panel/vhost/ssl/${DOMAIN}" ]; then
  cp "/www/server/panel/vhost/ssl/${DOMAIN}/fullchain.pem" "$CERT_DIR/fullchain.pem"
  cp "/www/server/panel/vhost/ssl/${DOMAIN}/privkey.pem" "$CERT_DIR/privkey.pem"
fi

# Install full HTTPS vhost (uploaded separately as clock.petralian.com.conf)
if [ -f "/tmp/clock.petralian.com.conf" ]; then
  cp /tmp/clock.petralian.com.conf "$NGINX_CONF"
fi

nginx -t
systemctl reload nginx

echo "DEPLOY_OK ${DOMAIN}"
