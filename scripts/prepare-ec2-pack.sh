#!/bin/bash
set -euo pipefail
# The builder downloads Debian/Nextcloud from their official sources. Only the
# pinned Node package, npm lockfile cache and course-owned files travel from here.
mkdir -p labs/output/ec2-bootstrap/opt/course/packages
SOURCE=labs/output/ec2-pack/opt/course
if ! test -f "$SOURCE/packages/nodejs.deb"; then
 mkdir -p "$SOURCE"
 CONTAINER_ID=$(docker create --platform linux/amd64 comandos-linux-lab:2)
 trap 'docker rm "$CONTAINER_ID" >/dev/null' EXIT
 docker cp "$CONTAINER_ID:/opt/course/." "$SOURCE/"
fi
cp "$SOURCE/packages/nodejs.deb" labs/output/ec2-bootstrap/opt/course/packages/
cp -R "$SOURCE/npm-cache" "$SOURCE/starter" "$SOURCE/tls" "$SOURCE/config" labs/output/ec2-bootstrap/opt/course/
cp labs/check.py labs/course-http.service labs/ec2/bake.sh labs/notes.service labs/output/ec2-bootstrap/opt/course/
COPYFILE_DISABLE=1 tar --exclude='._*' --exclude='.DS_Store' -czf labs/output/ec2-course-pack.tar.gz -C labs/output/ec2-bootstrap opt
shasum -a 256 labs/output/ec2-course-pack.tar.gz > labs/output/ec2-course-pack.sha256
