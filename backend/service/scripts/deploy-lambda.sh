#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
ENVIRONMENT="${1:-prod}"
PROFILE="${2:-default}"
REGION="${AWS_REGION:-us-east-1}"
PACKAGE_PATH="${LAMBDA_PACKAGE_PATH:-$ROOT_DIR/lambda-package.zip}"
AWS_ARGS=(--region "$REGION")
if [[ "$PROFILE" != "-" ]]; then AWS_ARGS+=(--profile "$PROFILE"); fi

if [[ "${SKIP_LAMBDA_BUILD:-false}" != "true" ]]; then
  bash scripts/build-lambda.sh
  PACKAGE_PATH="$ROOT_DIR/lambda-package.zip"
fi
[[ -s "$PACKAGE_PATH" ]] || { echo "Lambda package not found: $PACKAGE_PATH" >&2; exit 1; }

STACK_NAME="linux-lab-${ENVIRONMENT}-linux-lab-progress-lambda"
# A failed *first* create leaves the stack in ROLLBACK_COMPLETE with no resources;
# CloudFormation cannot update it, so remove the empty shell and create again.
if STATUS="$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" "${AWS_ARGS[@]}" \
    --query 'Stacks[0].StackStatus' --output text 2>&1)"; then
  if [[ "$STATUS" == "ROLLBACK_COMPLETE" ]]; then
    echo "Stack $STACK_NAME is ROLLBACK_COMPLETE (failed first create); deleting the empty stack"
    aws cloudformation delete-stack --stack-name "$STACK_NAME" "${AWS_ARGS[@]}"
    aws cloudformation wait stack-delete-complete --stack-name "$STACK_NAME" "${AWS_ARGS[@]}"
  fi
elif [[ "$STATUS" != *"does not exist"* ]]; then
  echo "Could not read stack status for $STACK_NAME: $STATUS" >&2
  exit 1
fi

aws cloudformation deploy \
  --template-file cloudformation/lambda.yml \
  --stack-name "$STACK_NAME" \
  --parameter-overrides "Environment=${ENVIRONMENT}" \
  --capabilities CAPABILITY_NAMED_IAM \
  "${AWS_ARGS[@]}" --no-fail-on-empty-changeset

FUNCTION_NAME="linux-lab-${ENVIRONMENT}-linux-lab-progress-lambda"
UPDATED=false
for attempt in 1 2 3; do
  if aws lambda update-function-code --function-name "$FUNCTION_NAME" \
      --zip-file "fileb://$PACKAGE_PATH" "${AWS_ARGS[@]}"; then
    UPDATED=true
    break
  fi
  if [[ "$attempt" -lt 3 ]]; then
    echo "Lambda update attempt $attempt failed; retrying in 5 seconds." >&2
    sleep 5
  fi
done
if [[ "$UPDATED" != "true" ]]; then
  echo "Failed to update $FUNCTION_NAME after 3 attempts." >&2
  exit 1
fi
aws lambda wait function-updated-v2 --function-name "$FUNCTION_NAME" \
  "${AWS_ARGS[@]}"
