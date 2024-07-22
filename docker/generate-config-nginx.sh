#!/bin/bash

# Clear existing config
rm -f /etc/nginx/conf.d/*.conf

# Parse PROXY_DOMAINS JSON array and generate config for each domain
echo $PROXY_DOMAINS | jq -c '.[]' | while read -r domain_config; do
    proxy_domain=$(echo $domain_config | jq -r '.proxy_domain')
    target_domain=$(echo $domain_config | jq -r '.target_domain')
    original_hostname=$(echo $domain_config | jq -r '.original_hostname')

    cat << EOF > /etc/nginx/conf.d/${proxy_domain}.conf
server {
    listen 443 ssl;
    server_name ${proxy_domain};

    ssl_certificate /etc/ssl/cert.pem;
    ssl_certificate_key /etc/ssl/key.pem;

    # Disable access and error logs
    access_log off;
    error_log /dev/null crit;

    # Main site proxy
    location / {
        proxy_pass https://${target_domain};
        proxy_set_header Host ${original_hostname};
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # Prevent following redirects
        proxy_redirect ~^(https?://)${original_hostname}(/.+)$ \$1${proxy_domain}\$2;

        # Remove all CSP headers
        proxy_hide_header Content-Security-Policy;
        proxy_hide_header Content-Security-Policy-Report-Only;
        proxy_hide_header X-Frame-Options;
        proxy_hide_header X-Content-Type-Options;

        # Add permissive CSP header
        add_header Content-Security-Policy "default-src * data: blob: filesystem: about: ws: wss: 'unsafe-inline' 'unsafe-eval' 'unsafe-dynamic';" always;

        # Remove CORS headers
        proxy_hide_header Access-Control-Allow-Origin;
        proxy_hide_header Access-Control-Allow-Methods;
        proxy_hide_header Access-Control-Allow-Headers;
        proxy_hide_header Access-Control-Allow-Credentials;

        # Add permissive CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS, PUT, DELETE' always;
        add_header 'Access-Control-Allow-Headers' '*' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        add_header 'Access-Control-Expose-Headers' '*' always;

        # Handle preflight requests
        if (\$request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS, PUT, DELETE';
            add_header 'Access-Control-Allow-Headers' '*';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain charset=UTF-8';
            add_header 'Content-Length' 0;
            return 204;
        }

        # Modify cookies
        proxy_cookie_domain ${original_hostname} ${proxy_domain};
        proxy_cookie_path / "/; HttpOnly; Secure; SameSite=None";

        # Handle SSL verification
        proxy_ssl_server_name on;
        proxy_ssl_name ${original_hostname};

        # Modify any URLs in the response body
        sub_filter_types *;
        sub_filter ${original_hostname} ${proxy_domain};
        sub_filter 'https://${target_domain}' 'https://${proxy_domain}';
        sub_filter 'http://${target_domain}' 'https://${proxy_domain}';
        sub_filter_once off;

        # Prevent caching
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
        if_modified_since off;
        expires off;
        etag off;
    }
}
EOF
done

cat << EOF > /etc/nginx/conf.d/app.conf
server {
    listen 443 ssl;
    server_name ${APP_DOMAIN};

    ssl_certificate /etc/ssl/cert.pem;
    ssl_certificate_key /etc/ssl/key.pem;

    # Disable access and error logs
    access_log off;
    error_log /dev/null crit;

    # API proxy
    location / {
        proxy_pass https://node:${APP_PORT:-3000};
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # SSE specific settings
        proxy_set_header Connection '';
        proxy_http_version 1.1;
        chunked_transfer_encoding off;
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 24h;
    }
}
EOF