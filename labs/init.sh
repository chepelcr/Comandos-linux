#!/bin/bash
set -e
mkdir -p /run/sshd /opt/course/http /home/student/practice
ssh-keygen -A >/dev/null 2>&1

cp -a /opt/course/starter /home/student/linux-lab-notes
git config --system init.defaultBranch main
git config --system user.email student@lab.invalid
git config --system user.name Student
git init --bare /opt/course/remote.git >/dev/null
chown -R student:student /opt/course/remote.git
git -C /home/student/linux-lab-notes init >/dev/null
git -C /home/student/linux-lab-notes add .
git -C /home/student/linux-lab-notes commit -m 'Initial course app' >/dev/null
tar -czf /opt/course/http/starter.tar.gz -C /opt/course starter
ln -sf /opt/course/bridge/nextcloud-lab.tar.gz /opt/course/http/nextcloud-lab.tar.gz
cp /opt/course/config/firewall.sh /opt/course/http/firewall.sh
printf "127.0.0.1 notes.lab cloud.lab\n" >> /etc/hosts
printf "[sshd]\nenabled=true\nbackend=systemd\n" > /etc/fail2ban/jail.d/course.conf

chown -R student:student /home/student
printf '\nLinux Lab · offline Linux environment\nLocal packages: /opt/course/packages\nStarter: /home/student/linux-lab-notes\nRun: sudo apt update && sudo apt install nodejs\n\n'
exec /sbin/init
