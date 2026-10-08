#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
revision=ecb4caa499f19f1d5cfcddd43b80aa78f98e5102
assets="${C2W_ASSETS:-$PWD/labs/.tools/container2wasm}"
if [[ ! -d "$assets/.git" ]]; then
  mkdir -p "$(dirname "$assets")"
  git clone https://github.com/container2wasm/container2wasm.git "$assets"
fi
git -C "$assets" checkout --detach "$revision"
python3 labs/runtime/patch.py "$assets"
converter="${C2W_BIN:-$PWD/labs/.tools/c2w}"
if [[ ! -x "$converter" ]]; then (cd "$assets" && go build -o "$converter" ./cmd/c2w); fi
node scripts/prepare-nextcloud.mjs
cp public/files/firewall.sh labs/config/firewall.sh
docker build --platform linux/amd64 -t comandos-linux-lab:2 labs
mkdir -p public/lab/runtime
"$converter" --assets "$assets" --dockerfile "$assets/Dockerfile" --to-js --target-arch=amd64 --build-arg VM_MEMORY_SIZE_MB=1536 --build-arg LINUX_LOGLEVEL=3 comandos-linux-lab:2 "$PWD/public/lab/runtime/"
node scripts/package-lab.mjs
