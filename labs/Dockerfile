FROM node:24-bookworm-slim AS packages
WORKDIR /starter
COPY starter/ ./
RUN npm ci --cache /opt/course/npm-cache --no-audit --no-fund && rm -rf node_modules frontend/node_modules api/node_modules
RUN mkdir -p /node-deb/DEBIAN /node-deb/usr/bin /node-deb/usr/lib && cp /usr/local/bin/node /node-deb/usr/bin/node && cp -a /usr/local/lib/node_modules /node-deb/usr/lib/ && ln -s ../lib/node_modules/npm/bin/npm-cli.js /node-deb/usr/bin/npm && ln -s ../lib/node_modules/npm/bin/npx-cli.js /node-deb/usr/bin/npx && printf 'Package: nodejs\nVersion: %s-course\nArchitecture: amd64\nMaintainer: Linux Course\nDescription: Pinned Node runtime and npm for offline course\n' "$(node -p 'process.versions.node')" > /node-deb/DEBIAN/control && dpkg-deb --build /node-deb /opt/course/nodejs.deb

FROM debian:bookworm-slim
ENV DEBIAN_FRONTEND=noninteractive
RUN rm -f /etc/apt/apt.conf.d/docker-clean && apt-get update && apt-get install -y bash sudo coreutils findutils grep sed gawk less man-db vim-tiny nano gzip bzip2 xz-utils zip unzip openssh-server git curl wget python3 dpkg-dev iptables iproute2 procps systemd systemd-sysv dbus libstdc++6 openssl ca-certificates nginx fail2ban && apt-get install --download-only -y apache2 php php-cli php-mysql php-xml php-mbstring php-curl php-zip mariadb-server phpmyadmin certbot python3-certbot-nginx python3-certbot-apache libapache2-mod-php php-gd php-intl php-bcmath php-gmp nmap rkhunter chkrootkit iptables-persistent && mkdir -p /opt/course/packages /run/sshd && cp /var/cache/apt/archives/*.deb /opt/course/packages/ && rm -f /var/cache/apt/archives/*.deb
COPY --from=packages /opt/course/npm-cache /opt/course/npm-cache
COPY --from=packages /opt/course/nodejs.deb /opt/course/packages/nodejs.deb
COPY --from=packages /starter /opt/course/starter
COPY notes.service /opt/course/notes.service
COPY init.sh /opt/course/init.sh
COPY agent.py /opt/course/agent.py
COPY config/ /opt/course/config/
COPY course-console.service course-agent.service course-http.service /etc/systemd/system/
RUN systemctl enable course-console.service course-agent.service course-http.service ssh.service && systemctl mask getty@tty1.service console-getty.service && mkdir -p /opt/course/bridge /opt/course/tls && openssl req -x509 -newkey rsa:2048 -nodes -keyout /opt/course/tls/ca.key -out /opt/course/tls/ca.crt -subj "/CN=Linux Lab Local CA" -days 3650 && openssl req -newkey rsa:2048 -nodes -keyout /opt/course/tls/server.key -out /opt/course/tls/server.csr -subj "/CN=notes.lab" && printf "subjectAltName=DNS:notes.lab,DNS:localhost,IP:127.0.0.1\n" > /opt/course/tls/server.ext && openssl x509 -req -in /opt/course/tls/server.csr -CA /opt/course/tls/ca.crt -CAkey /opt/course/tls/ca.key -CAcreateserial -out /opt/course/tls/server.crt -days 3650 -extfile /opt/course/tls/server.ext
COPY check.py /usr/local/bin/course-check
RUN chmod +x /opt/course/init.sh /usr/local/bin/course-check && useradd -m -s /bin/bash student && echo 'student:student' | chpasswd && echo 'student ALL=(ALL) NOPASSWD:ALL' > /etc/sudoers.d/student && cd /opt/course/packages && dpkg-scanpackages . /dev/null > Packages && gzip -k Packages && rm -f /etc/apt/sources.list.d/* && echo 'deb [trusted=yes] file:/opt/course/packages ./' > /etc/apt/sources.list && git config --global user.email student@lab.invalid && git config --global user.name Student
WORKDIR /home/student
ENTRYPOINT ["/opt/course/init.sh"]
