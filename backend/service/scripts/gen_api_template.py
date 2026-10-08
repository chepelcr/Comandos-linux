#!/usr/bin/env python3
"""Generate API Gateway SAM JSON/YAML and endpoint inventory from OpenAPI."""
from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
SPEC_PATH = ROOT / "swagger" / 'linux-lab-progress.json'
SKIP_PREFIXES = tuple(['/health', '/api-docs'])
REQUIRE_AUTH = True
CORS_ALLOW_HEADERS = 'Authorization,Content-Type,X-User-Id'
FUNCTION_NAME = 'linux-lab-${Environment}-linux-lab-progress-lambda'
ENVIRONMENTS = ['prod']
DEFAULT_DOMAIN = ''
DEFAULT_ZONE = ''
DEFAULT_POOL = ''


def integration() -> dict[str, Any]:
    return {
        "type": "aws_proxy",
        "httpMethod": "POST",
        "uri": {
            "Fn::Sub": (
                "arn:${AWS::Partition}:apigateway:${AWS::Region}:lambda:path/2015-03-31/"
                "functions/arn:${AWS::Partition}:lambda:${AWS::Region}:${AWS::AccountId}:"
                f"function:{FUNCTION_NAME}/invocations"
            )
        },
    }


def prepare_definition(source: dict[str, Any]) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    definition = {key: value for key, value in source.items() if key not in {"servers"}}
    paths: dict[str, Any] = {}
    endpoints: list[dict[str, Any]] = []
    for path, path_item in source.get("paths", {}).items():
        if any(path.startswith(prefix) for prefix in SKIP_PREFIXES):
            continue
        rendered: dict[str, Any] = {}
        for method in ("get", "post", "put", "patch", "delete"):
            if method not in path_item:
                continue
            operation = dict(path_item[method])
            operation["x-amazon-apigateway-integration"] = integration()
            if REQUIRE_AUTH:
                operation["security"] = [{"CognitoAuthorizer": []}]
            rendered[method] = operation
            endpoints.append({
                "method": method.upper(), "path": path,
                "operationId": operation.get("operationId", ""),
                "summary": operation.get("summary", ""),
                "authRequired": REQUIRE_AUTH,
            })
        if rendered:
            paths[path] = rendered
    if not paths:
        raise ValueError("No API operations found after skip-prefix filtering")
    definition["paths"] = paths
    components = definition.setdefault("components", {})
    schemes = components.setdefault("securitySchemes", {})
    if REQUIRE_AUTH:
        schemes["CognitoAuthorizer"] = {
            "type": "apiKey", "name": "Authorization", "in": "header",
            "x-amazon-apigateway-authtype": "cognito_user_pools",
            "x-amazon-apigateway-authorizer": {
                "type": "cognito_user_pools",
                "providerARNs": [{"Fn::Sub": (
                    "arn:${AWS::Partition}:cognito-idp:${AWS::Region}:${AWS::AccountId}:"
                    "userpool/${CognitoPoolId}"
                )}],
            },
        }
    return definition, endpoints


def build_template(definition: dict[str, Any]) -> dict[str, Any]:
    has_domain = "HasCustomDomain"
    resources: dict[str, Any] = {
        "ApiGateway": {
            "Type": "AWS::Serverless::Api",
            "Properties": {
                "Name": {"Fn::Sub": "${AWS::StackName}"},
                "StageName": {"Ref": "Environment"},
                # Object form: the string shorthand fails cfn-lint (E3012/E3017).
                "EndpointConfiguration": {"Type": "REGIONAL"},
                # The definition is OpenAPI 3; also stops SAM creating an extra "Stage" stage.
                "OpenApiVersion": "3.0.1",
                "DefinitionBody": definition,
                # SAM adds unauthenticated OPTIONS mocks: operations carry the Cognito
                # security requirement, so browser preflights never reach the authorizer.
                "Cors": {
                    "AllowMethods": "'GET,POST,PUT,PATCH,DELETE,OPTIONS'",
                    "AllowHeaders": f"'{CORS_ALLOW_HEADERS}'",
                    "AllowOrigin": "'*'",
                },
                # Gateway-generated errors (e.g. the authorizer's 401) need CORS headers
                # too, otherwise browsers see an opaque CORS failure instead of the status.
                "GatewayResponses": {
                    response_type: {
                        "ResponseParameters": {
                            "Headers": {
                                "Access-Control-Allow-Origin": "'*'",
                                "Access-Control-Allow-Headers": f"'{CORS_ALLOW_HEADERS}'",
                            }
                        }
                    }
                    for response_type in ("DEFAULT_4XX", "DEFAULT_5XX")
                },
            },
        },
        "LambdaPermission": {
            "Type": "AWS::Lambda::Permission",
            "Properties": {
                "Action": "lambda:InvokeFunction",
                "FunctionName": {"Fn::Sub": FUNCTION_NAME},
                "Principal": "apigateway.amazonaws.com",
                "SourceArn": {"Fn::Sub": (
                    "arn:${AWS::Partition}:execute-api:${AWS::Region}:${AWS::AccountId}:"
                    "${ApiGateway}/*/*/*"
                )},
            },
        },
        "ApiCertificate": {
            "Condition": has_domain,
            "Type": "AWS::CertificateManager::Certificate",
            "Properties": {
                "DomainName": {"Ref": "DomainName"}, "ValidationMethod": "DNS",
                "DomainValidationOptions": [{
                    "DomainName": {"Ref": "DomainName"},
                    "HostedZoneId": {"Ref": "HostedZoneId"},
                }],
            },
        },
        "ApiDomainName": {
            "Condition": has_domain,
            "Type": "AWS::ApiGateway::DomainName",
            "Properties": {
                "DomainName": {"Ref": "DomainName"},
                "EndpointConfiguration": {"Types": ["REGIONAL"]},
                "RegionalCertificateArn": {"Ref": "ApiCertificate"},
                "SecurityPolicy": "TLS_1_2",
            },
        },
        "ApiBasePathMapping": {
            "Condition": has_domain,
            "Type": "AWS::ApiGateway::BasePathMapping",
            "DependsOn": ["ApiGatewayStage"],
            "Properties": {
                "DomainName": {"Ref": "ApiDomainName"},
                "RestApiId": {"Ref": "ApiGateway"},
                "Stage": {"Ref": "Environment"},
            },
        },
        "ApiDnsRecord": {
            "Condition": has_domain,
            "Type": "AWS::Route53::RecordSet",
            "Properties": {
                "HostedZoneId": {"Ref": "HostedZoneId"},
                "Name": {"Ref": "DomainName"}, "Type": "A",
                "AliasTarget": {
                    "DNSName": {"Fn::GetAtt": ["ApiDomainName", "RegionalDomainName"]},
                    "HostedZoneId": {"Fn::GetAtt": ["ApiDomainName", "RegionalHostedZoneId"]},
                },
            },
        },
    }
    return {
        "AWSTemplateFormatVersion": "2010-09-09",
        "Transform": "AWS::Serverless-2016-10-31",
        "Parameters": {
            "Environment": {"Type": "String", "Default": ENVIRONMENTS[0], "AllowedValues": ENVIRONMENTS},
            "CognitoPoolId": {"Type": "String", "Default": DEFAULT_POOL},
            "DomainName": {"Type": "String", "Default": DEFAULT_DOMAIN},
            "HostedZoneId": {"Type": "String", "Default": DEFAULT_ZONE},
        },
        "Conditions": {
            has_domain: {"Fn::Not": [{"Fn::Equals": [{"Ref": "DomainName"}, ""]}]},
        },
        "Resources": resources,
        "Outputs": {
            "ApiId": {"Value": {"Ref": "ApiGateway"}},
            "ApiInvokeUrl": {"Value": {"Fn::Sub": (
                "https://${ApiGateway}.execute-api.${AWS::Region}.amazonaws.com/${Environment}"
            )}},
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--skip-refresh", action="store_true")
    args = parser.parse_args()
    if not args.skip_refresh:
        subprocess.run(["node", "scripts/generate-swagger-spec.cjs"], cwd=ROOT, check=True)
    source = json.loads(SPEC_PATH.read_text(encoding="utf-8"))
    definition, endpoints = prepare_definition(source)
    target = ROOT / "api-gateway"
    target.mkdir(parents=True, exist_ok=True)
    (target / "template.yml").write_text(
        json.dumps(build_template(definition), indent=2) + "\n", encoding="utf-8"
    )
    (target / "endpoints.json").write_text(
        json.dumps(endpoints, indent=2) + "\n", encoding="utf-8"
    )
    print(f"Generated {len(definition['paths'])} paths and {len(endpoints)} operations")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
