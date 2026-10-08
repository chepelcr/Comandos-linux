#!/usr/bin/env bash
# Deploy the API Gateway stack (REST API, Cognito authorizer, optional custom domain).
# Usage: bash scripts/deploy-api.sh [environment] [profile|-] [--skip-refresh]
#   profile "-" uses ambient credentials (GitHub Actions OIDC / CodeBuild role).
# Flow (deploy-api-setup): OpenAPI refresh -> api-gateway/template.yml -> resolve
# domain/zone/pool -> ensure SAM bucket -> sam deploy --config-env <env> ->
# publish the stage -> smoke test.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"
ENVIRONMENT="${1:-prod}"
PROFILE="${2:-default}"
SKIP_REFRESH=false
for argument in "$@"; do
  if [[ "$argument" == "--skip-refresh" ]]; then
    SKIP_REFRESH=true
  fi
done
case "$ENVIRONMENT" in
  prod) ;;
  *) echo "Unsupported environment '$ENVIRONMENT'" >&2; exit 2 ;;
esac
REGION="${AWS_REGION:-us-east-1}"
AWS_ARGS=(--region "$REGION")
if [[ "$PROFILE" != "-" ]]; then AWS_ARGS+=(--profile "$PROFILE"); fi

# SAM CLI: use the installed one, otherwise a local venv (deploy-api-setup convention).
if ! command -v sam >/dev/null 2>&1; then
  VENV_DIR="$REPO_ROOT/.venv-sam"
  if [[ ! -x "$VENV_DIR/bin/sam" ]]; then
    python3 -m venv "$VENV_DIR"
    "$VENV_DIR/bin/pip" install -q aws-sam-cli
  fi
  export PATH="$VENV_DIR/bin:$PATH"
fi

# Steps 1+2: OpenAPI -> api-gateway/template.yml + endpoints.json
if [[ "$SKIP_REFRESH" == "true" ]]; then
  echo "Skipping OpenAPI refresh (--skip-refresh)"
  python3 scripts/gen_api_template.py --skip-refresh
else
  python3 scripts/gen_api_template.py
fi

# Step 3: resolve deploy values.
# API Gateway settings: environment variables win, then manifest defaults, then
# SSM Parameter Store (and Route 53 for the hosted zone). Lookup failures are
# reported, never silently swallowed.
API_SSM_BASE="/linux-lab/${ENVIRONMENT}/linux-lab-progress"
API_REQUIRE_AUTH=true
api_ssm_value() {
  local name="$1" output
  if output="$(aws ssm get-parameter --name "$name" "${AWS_ARGS[@]}" \
      --query Parameter.Value --output text 2>&1)"; then
    printf '%s' "$output"
  elif [[ "$output" == *ParameterNotFound* ]]; then
    echo "[api] SSM parameter $name not found" >&2
  else
    echo "[api] WARN: could not read SSM parameter $name: $output" >&2
  fi
}
resolve_api_settings() {
  local cognito_parameter="${COGNITO_POOL_SSM_PARAM:-/linux-lab/${ENVIRONMENT}/linux-lab-progress/api/cognito-pool-id}"
  DOMAIN_NAME="${API_DOMAIN:-}"
  if [[ -z "$DOMAIN_NAME" ]]; then
    DOMAIN_NAME="$(api_ssm_value "${API_DOMAIN_SSM_PARAM:-$API_SSM_BASE/api/domain}")"
  fi
  HOSTED_ZONE="${HOSTED_ZONE_ID:-}"
  if [[ -z "$DOMAIN_NAME" ]]; then
    HOSTED_ZONE=""
  elif [[ -z "$HOSTED_ZONE" ]]; then
    HOSTED_ZONE="$(api_ssm_value "${HOSTED_ZONE_SSM_PARAM:-$API_SSM_BASE/api/hosted-zone-id}")"
  fi
  if [[ -n "$DOMAIN_NAME" && -z "$HOSTED_ZONE" ]]; then
    local root_domain="${ROOT_DOMAIN:-}"
    local zone_output
    root_domain="${root_domain:-${DOMAIN_NAME#*.}}"
    if zone_output="$(aws route53 list-hosted-zones-by-name --dns-name "$root_domain" \
        --max-items 1 "${AWS_ARGS[@]}" --query 'HostedZones[0].[Name,Id]' --output text 2>&1)"; then
      if [[ "$zone_output" == "$root_domain."* ]]; then
        HOSTED_ZONE="${zone_output##*/hostedzone/}"
      fi
    else
      echo "[api] WARN: Route 53 hosted-zone lookup for $root_domain failed: $zone_output" >&2
    fi
  fi
  COGNITO_POOL="${COGNITO_POOL_ID:-}"
  if [[ -z "$COGNITO_POOL" ]]; then
    COGNITO_POOL="$(api_ssm_value "$cognito_parameter")"
  fi
  if [[ "$API_REQUIRE_AUTH" == "true" && -z "$COGNITO_POOL" ]]; then
    echo "Cognito user pool id not found: set COGNITO_POOL_ID or SSM $cognito_parameter." >&2
    return 1
  fi
  if [[ -n "$DOMAIN_NAME" && -z "$HOSTED_ZONE" ]]; then
    echo "No Route 53 hosted zone for $DOMAIN_NAME: set HOSTED_ZONE_ID or SSM $API_SSM_BASE/api/hosted-zone-id." >&2
    return 1
  fi
  return 0
}
resolve_api_settings
echo "API Gateway ${ENVIRONMENT}: pool=${COGNITO_POOL:-<none>} domain=${DOMAIN_NAME:-<none>} zone=${HOSTED_ZONE:-<none>}"

# SAM uploads the template to this bucket (named in api-gateway/samconfig.toml).
ARTIFACT_BUCKET="linux-lab-${ENVIRONMENT}-sam-deployments"
if ! aws s3api head-bucket --bucket "$ARTIFACT_BUCKET" "${AWS_ARGS[@]}" >/dev/null 2>&1; then
  echo "Creating SAM artifact bucket $ARTIFACT_BUCKET"
  if [[ "$REGION" == "us-east-1" ]]; then
    aws s3api create-bucket --bucket "$ARTIFACT_BUCKET" "${AWS_ARGS[@]}" >/dev/null
  else
    aws s3api create-bucket --bucket "$ARTIFACT_BUCKET" "${AWS_ARGS[@]}" \
      --create-bucket-configuration "LocationConstraint=$REGION" >/dev/null
  fi
  aws s3api put-public-access-block --bucket "$ARTIFACT_BUCKET" "${AWS_ARGS[@]}" \
    --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
  aws s3api put-bucket-encryption --bucket "$ARTIFACT_BUCKET" "${AWS_ARGS[@]}" \
    --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
  aws s3api put-bucket-lifecycle-configuration --bucket "$ARTIFACT_BUCKET" "${AWS_ARGS[@]}" \
    --lifecycle-configuration '{"Rules":[{"ID":"expire-artifacts","Status":"Enabled","Filter":{},"Expiration":{"Days":30}}]}'
fi

# Step 4: SAM deploy from api-gateway/ so samconfig.toml and template.yml resolve
# relative to that directory.
PARAMETERS=("Environment=${ENVIRONMENT}")
if [[ -n "$DOMAIN_NAME" ]]; then PARAMETERS+=("DomainName=${DOMAIN_NAME}" "HostedZoneId=${HOSTED_ZONE}"); fi
if [[ -n "$COGNITO_POOL" ]]; then PARAMETERS+=("CognitoPoolId=${COGNITO_POOL}"); fi
SAM_ARGS=(--config-env "$ENVIRONMENT" --template-file template.yml
  --no-fail-on-empty-changeset --parameter-overrides "${PARAMETERS[*]}")
if [[ "$PROFILE" != "-" ]]; then SAM_ARGS+=(--profile "$PROFILE"); fi
(cd api-gateway && sam deploy "${SAM_ARGS[@]}")

# Step 5: SAM only creates a new API Gateway Deployment when its hash of the
# definition changes, so auth/CORS/gateway-response updates can land on the REST
# API without reaching the stage. Always publish the current config to the stage.
STACK_NAME="linux-lab-${ENVIRONMENT}-linux-lab-progress-api"
REST_API_ID="$(aws cloudformation describe-stack-resource --stack-name "$STACK_NAME" \
  --logical-resource-id ApiGateway "${AWS_ARGS[@]}" \
  --query 'StackResourceDetail.PhysicalResourceId' --output text)"
aws apigateway create-deployment --rest-api-id "$REST_API_ID" --stage-name "$ENVIRONMENT" \
  --description "deploy-api.sh $(date -u +%Y-%m-%dT%H:%M:%SZ)" "${AWS_ARGS[@]}" >/dev/null
echo "Published the current API configuration to stage ${ENVIRONMENT} (${REST_API_ID})"

# Step 6: smoke test (set SMOKE_TEST=false to skip). Warnings only: a new custom
# domain can take a few minutes to resolve.
if [[ -n "$DOMAIN_NAME" ]]; then
  BASE_URL="https://${DOMAIN_NAME}"
else
  BASE_URL="https://${REST_API_ID}.execute-api.${REGION}.amazonaws.com/${ENVIRONMENT}"
fi
if [[ "${SMOKE_TEST:-true}" == "true" ]] && command -v curl >/dev/null 2>&1; then
  SMOKE_PATH="$(python3 - <<'PY'
import json
import re
from pathlib import Path

endpoints = json.loads(Path("api-gateway/endpoints.json").read_text(encoding="utf-8"))
paths = [item["path"] for item in endpoints if item.get("method") == "GET"] or [
    item["path"] for item in endpoints
]
print(re.sub(r"\{[^}]+\}", "smoke-test", paths[0]) if paths else "")
PY
)"
  if [[ -n "$SMOKE_PATH" ]]; then
    echo "Smoke test against ${BASE_URL}${SMOKE_PATH}"
    if [[ "$API_REQUIRE_AUTH" == "true" ]]; then
      STATUS="$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "${BASE_URL}${SMOKE_PATH}" || echo n/a)"
      echo "  GET without token -> ${STATUS} (expect 401)"
      [[ "$STATUS" == "401" ]] || echo "  WARN: protected route did not return 401" >&2
    fi
    STATUS="$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 -X OPTIONS \
      -H 'Origin: https://example.com' -H 'Access-Control-Request-Method: GET' \
      -H 'Access-Control-Request-Headers: authorization,content-type' \
      "${BASE_URL}${SMOKE_PATH}" || echo n/a)"
    echo "  CORS preflight -> ${STATUS} (expect 200)"
    [[ "$STATUS" == "200" ]] || echo "  WARN: CORS preflight did not return 200" >&2
  fi
fi
echo "Done. API endpoint: ${BASE_URL}"
