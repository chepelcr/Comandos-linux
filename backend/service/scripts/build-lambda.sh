#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
node scripts/generate-swagger-spec.cjs --dist
test -f dist/swagger-spec.json
./node_modules/.bin/esbuild lambda.cts   --platform=node --bundle --format=cjs   --outfile=dist/lambda.js --external:@aws-sdk/* --external:pg-native
./node_modules/.bin/esbuild lab-lambda.cts --platform=node --bundle --format=cjs --outfile=dist/lab-lambda.js --external:@aws-sdk/*
rm -f lambda-package.zip
(cd dist && zip -j ../lambda-package.zip lambda.js lab-lambda.js swagger-spec.json)
test -f lambda-package.zip
echo "Built lambda-package.zip"
