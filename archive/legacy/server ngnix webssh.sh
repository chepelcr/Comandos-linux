server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name ssh.jcampos.me
    root /var/www/html;

    access_log /var/log/nginx/webssh.access.log;
    error_log /var/log/nginx/webssh.error.log;

    location / {
        proxy_pass http://127.0.0.1:8888;
        proxy_http_version 1.1;
        proxy_read_timeout 300;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Real-PORT $remote_port;
    }

    listen 443 ssl;
    # RSA certificate
    ssl_certificate /etc/letsencrypt/live/ssh.jcampos.me/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ssh.jcampos.me/privkey.pem;

    # Redirect non-https traffic to https
    if ($scheme != "https") {
        return 301 https://$host$request_uri;
    }
}

[Unit]
Description=WebSSH terminal interface
After=network.target

[Service]
User=www-data
Group=www-data
ExecStart=/home/sysadmin/environments/webssh-env/bin/wssh

[Install]
WantedBy=multi-user.target