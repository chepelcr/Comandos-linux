#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MAP_FILE="$ROOT_DIR/deploys/deployment-map.json"
cd "$ROOT_DIR"
ENVIRONMENT=""
PROFILE=""
PLAN_ONLY=false
SKIP_EVENTS=false
SKIP_API=false
HAS_API=true
HAS_INTEGRATED_EVENTS=false
REQUIRE_AUTH=true
REGION="${AWS_REGION:-us-east-1}"

usage() {
  cat <<'USAGE'
Usage: bash deploys/deploy-all.sh [environment] [profile|-] [options]

Options:
  --plan          Print the resolved deployment map without changing AWS.
  --skip-events   Invalid when Express event resources share the Lambda stack.
  --skip-api      Deploy the Lambda stack but skip API Gateway.
  -h, --help      Show this help.

Environment variables:
  AWS_REGION, COGNITO_POOL_ID, API_DOMAIN, and HOSTED_ZONE_ID may override
  generated defaults; unset API values fall back to SSM (see deploys/README.md),
  and a missing hosted zone is looked up in Route 53.
  Pass profile '-' to use ambient credentials (OIDC/CodeBuild/instance role).
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --plan) PLAN_ONLY=true ;;
    --skip-events) SKIP_EVENTS=true ;;
    --skip-api) SKIP_API=true ;;
    -h|--help) usage; exit 0 ;;
    --*) echo "Unknown option: $1" >&2; usage >&2; exit 2 ;;
    *)
      if [[ -z "$ENVIRONMENT" ]]; then
        ENVIRONMENT="$1"
      elif [[ -z "$PROFILE" ]]; then
        PROFILE="$1"
      else
        echo "Unexpected positional argument: $1" >&2
        usage >&2
        exit 2
      fi
      ;;
  esac
  shift
done

ENVIRONMENT="${ENVIRONMENT:-prod}"
PROFILE="${PROFILE:-default}"
case "$ENVIRONMENT" in
  prod) ;;
  *)
    echo "Unsupported environment '$ENVIRONMENT'; expected one of: prod" >&2
    exit 2
    ;;
esac

if [[ ! -f "$MAP_FILE" ]]; then
  echo "Missing deployment map: $MAP_FILE" >&2
  exit 1
fi

if [[ "$PLAN_ONLY" == "true" ]]; then
  command -v python3 >/dev/null 2>&1 || {
    echo "python3 is required to print the deployment plan" >&2
    exit 1
  }
  python3 - "$MAP_FILE" "$ENVIRONMENT" "$PROFILE" \
    "$SKIP_EVENTS" "$SKIP_API" <<'PY'
import json
import sys

path, environment, profile, skip_events, skip_api = sys.argv[1:]
with open(path, encoding="utf-8") as source:
    plan = json.load(source)

def resolve(value):
    if isinstance(value, str):
        return value.replace("${Environment}", environment)
    if isinstance(value, list):
        return [resolve(item) for item in value]
    if isinstance(value, dict):
        return {key: resolve(item) for key, item in value.items()}
    return value

plan = resolve(plan)
plan["selection"] = {
    "environment": environment,
    "profile": profile,
    "skipEvents": skip_events == "true",
    "skipApi": skip_api == "true",
}
print(json.dumps(plan, indent=2))
print("\nPlan only: no AWS, package, or SAM commands were run.")
PY
  exit 0
fi

if [[ "$HAS_INTEGRATED_EVENTS" == "true" && "$SKIP_EVENTS" == "true" ]]; then
  echo "Express event resources are part of the Lambda stack and cannot be skipped separately." >&2
  exit 1
fi

if [[ "$HAS_API" == "true" && "$SKIP_API" == "false" ]]; then
  command -v aws >/dev/null 2>&1 || { echo "Required command not found: aws" >&2; exit 1; }
  PREFLIGHT_AWS_ARGS=(--region "$REGION")
  if [[ "$PROFILE" != "-" ]]; then PREFLIGHT_AWS_ARGS+=(--profile "$PROFILE"); fi
  # API Gateway settings: environment variables win, then manifest defaults, then
  # SSM Parameter Store (and Route 53 for the hosted zone). Lookup failures are
  # reported, never silently swallowed.
  API_SSM_BASE="/linux-lab/${ENVIRONMENT}/linux-lab-progress"
  API_REQUIRE_AUTH=true
  api_ssm_value() {
    local name="$1" output
    if output="$(aws ssm get-parameter --name "$name" "${PREFLIGHT_AWS_ARGS[@]}" \
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
          --max-items 1 "${PREFLIGHT_AWS_ARGS[@]}" --query 'HostedZones[0].[Name,Id]' --output text 2>&1)"; then
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
  resolve_api_settings || exit 1
  # deploy-api.sh reuses these instead of looking them up again.
  export API_DOMAIN="$DOMAIN_NAME" HOSTED_ZONE_ID="$HOSTED_ZONE" COGNITO_POOL_ID="$COGNITO_POOL"
  echo "[preflight] api domain=${DOMAIN_NAME:-<none>} zone=${HOSTED_ZONE:-<none>} pool=${COGNITO_POOL:-<none>}"
fi

required_commands=(aws node zip)
if [[ "$HAS_API" == "true" && "$SKIP_API" == "false" ]]; then
  required_commands+=(python3 sam)
fi
for command_name in "${required_commands[@]}"; do
  command -v "$command_name" >/dev/null 2>&1 || {
    echo "Required command not found: $command_name" >&2
    exit 1
  }
done
if [[ ! -x "$ROOT_DIR/node_modules/.bin/esbuild" ]]; then
  echo "Missing node_modules/.bin/esbuild; install package.json dependencies before deployment." >&2
  exit 1
fi
if [[ "$HAS_API" == "true" && "$SKIP_API" == "false" ]]; then
  echo "[preflight] generating API Gateway template"
  python3 scripts/gen_api_template.py
fi

echo "Deployment map: $MAP_FILE"
echo "Environment:    $ENVIRONMENT"
if [[ "$PROFILE" == "-" ]]; then
  PROFILE_LABEL="ambient credentials"
else
  PROFILE_LABEL="$PROFILE"
fi
echo "Profile:        $PROFILE_LABEL"
echo "Region:         $REGION"

echo
echo "[phase lambda]"
bash "$ROOT_DIR/scripts/deploy-lambda.sh" "$ENVIRONMENT" "$PROFILE"

if [[ "$HAS_API" == "true" && "$SKIP_API" == "false" ]]; then
  echo
  echo "[phase api-gateway]"
  bash "$ROOT_DIR/scripts/deploy-api.sh" "$ENVIRONMENT" "$PROFILE" --skip-refresh
fi

echo
echo "Deployment completed successfully."
