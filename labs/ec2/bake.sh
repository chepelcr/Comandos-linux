#!/bin/bash
# Run only on the temporary image builder, which has outbound package access.
# Student instances use the baked image in a different VPC with no internet route.
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
find /opt/course -name '._*' -delete
chown -R root:root /opt/course
apt-get update
apt-get install -y bash sudo coreutils findutils grep sed gawk less man-db vim-tiny nano gzip bzip2 xz-utils zip unzip openssh-server git curl wget python3 dpkg-dev iptables iproute2 procps systemd systemd-sysv dbus libstdc++6 openssl ca-certificates nginx fail2ban
mkdir -p /opt/course/packages
# Fetch the pinned Nextcloud fixture only while baking, never in a student VM.
mkdir -p /opt/course/bridge
curl -fsSL --retry 3 https://download.nextcloud.com/server/releases/nextcloud-32.0.15.tar.bz2 -o /tmp/nextcloud.tar.bz2
printf '6974ac1195025f13643df176d456acf4523790d5488c205b57539f642c7d164c  /tmp/nextcloud.tar.bz2\n' | sha256sum --check
python3 - <<'PYTHON'
import tarfile,pathlib
allowed={'activity','cloud_federation_api','dav','federatedfilesharing','federation','files','files_sharing','files_trashbin','files_versions','logreader','lookup_server_connector','oauth2','provisioning_api','settings','theming','twofactor_backupcodes','viewer','workflowengine'}
with tarfile.open('/tmp/nextcloud.tar.bz2','r:bz2') as source,tarfile.open('/opt/course/bridge/nextcloud-lab.tar.gz','w:gz',compresslevel=1) as target:
 for member in source:
  parts=pathlib.PurePosixPath(member.name).parts
  if 'apps' in parts:
   i=parts.index('apps')
   if len(parts)>i+1 and parts[i+1] not in allowed:continue
  target.addfile(member,source.extractfile(member) if member.isfile() else None)
PYTHON
rm /tmp/nextcloud.tar.bz2
# Keep every dependency of later package installations available in a local APT repo.
apt-get install --download-only -y apache2 php php-cli php-mysql php-xml php-mbstring php-curl php-zip mariadb-server phpmyadmin certbot python3-certbot-nginx python3-certbot-apache libapache2-mod-php php-gd php-intl php-bcmath php-gmp nmap rkhunter chkrootkit iptables-persistent
cp /var/cache/apt/archives/*.deb /opt/course/packages/
cd /opt/course/packages
dpkg-scanpackages . /dev/null > Packages
gzip -f -k Packages
rm -f /etc/apt/sources.list.d/*
printf 'deb [trusted=yes] file:/opt/course/packages ./\n' > /etc/apt/sources.list
apt-get update
id student >/dev/null 2>&1 || useradd -m -s /bin/bash student
# No shared login password. Browser access uses the restricted SSM document.
passwd -l student
printf 'student ALL=(ALL) NOPASSWD:ALL\n' > /etc/sudoers.d/student
chmod 440 /etc/sudoers.d/student
install -m755 /opt/course/check.py /usr/local/bin/course-check
install -m644 /opt/course/course-http.service /etc/systemd/system/course-http.service
# Bake the initial workspace once; no dependency downloads run when a student starts.
mkdir -p /opt/course/http /home/student/practice
cp -a /opt/course/starter /home/student/linux-lab-notes
git config --system init.defaultBranch main
git config --system user.email student@lab.invalid
git config --system user.name Student
git init --bare /opt/course/remote.git
chown -R student:student /opt/course/remote.git
git -C /home/student/linux-lab-notes init
git -C /home/student/linux-lab-notes add .
git -C /home/student/linux-lab-notes commit -m 'Initial course app'
tar -czf /opt/course/http/starter.tar.gz -C /opt/course starter
ln -sf /opt/course/bridge/nextcloud-lab.tar.gz /opt/course/http/nextcloud-lab.tar.gz
cp /opt/course/config/firewall.sh /opt/course/http/firewall.sh
printf '127.0.0.1 notes.lab cloud.lab\n' >> /etc/hosts
printf '[sshd]\nenabled=true\nbackend=systemd\n' > /etc/fail2ban/jail.d/course.conf
chown -R student:student /home/student /opt/course/npm-cache
# Local safety timer supplements, rather than replaces, the AWS reaper.
cat > /etc/systemd/system/course-deadline.service <<'UNIT'
[Unit]
Description=Terminate this ephemeral course lab
[Service]
Type=oneshot
ExecStart=/sbin/shutdown -h now
UNIT
cat > /etc/systemd/system/course-deadline.timer <<'UNIT'
[Unit]
Description=Absolute 90-minute course lab deadline
[Timer]
OnBootSec=90min
AccuracySec=1s
Unit=course-deadline.service
[Install]
WantedBy=timers.target
UNIT
systemctl enable course-http.service course-deadline.timer ssh.service amazon-ssm-agent.service
# Test real offline installs / lockfile dependencies in the image before publication.
apt-get install -y nodejs
cd /home/student/linux-lab-notes
sudo -u student npm ci --offline --cache /opt/course/npm-cache --no-audit --no-fund
sudo -u student npm test
sudo -u student npm run build
rm -rf node_modules api/node_modules frontend/node_modules frontend/dist
apt-get remove -y nodejs
rm -f /var/cache/apt/archives/*.deb
# Ensure the snapshot has no builder registration, credentials or machine identity.
systemctl stop amazon-ssm-agent
rm -rf /var/lib/amazon/ssm/* /var/log/amazon/ssm/* /var/lib/cloud/instances/* /root/.aws /home/admin/.aws
rm -f /etc/ssh/ssh_host_* /var/log/cloud-init-output.log /var/log/cloud-init.log
truncate -s 0 /etc/machine-id
printf 'verified-offline-packages\n' > /opt/course/image-ready
