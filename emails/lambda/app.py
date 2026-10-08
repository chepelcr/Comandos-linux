"""Cognito CustomMessage Lambda — branded HTML email via SES templates.

Wire this into one or more Cognito user pools. Before Cognito sends a sign-up /
forgot-password / attribute-verify / admin-create-user message it invokes this
function; we resolve the trigger + the user's locale to a logical template name,
fetch that template from SES (`ses:GetTemplate`, module-cached so warm containers
skip the round-trip), rewrite the author-friendly `{{code}}`/`{{username}}`
placeholders to Cognito's literal `{####}`/`{username}` form, and set
`event.response.{emailSubject,emailMessage}`.

If a template is missing in SES the event is returned unchanged so Cognito falls
back to its stock default — no auth flow 500s because a template wasn't uploaded.

Config via environment variables (set in the Lambda template):
  TEMPLATE_PREFIX  project prefix used in the SES template name (e.g. "tsuru")
  ENVIRONMENT      dev | stag | prod
  DEFAULT_LANG     fallback language when locale is absent/unknown (default "es")
SES template name resolved as: {TEMPLATE_PREFIX}-{ENVIRONMENT}-{logical}-{lang}
"""
from __future__ import annotations

import logging
import os
import re
from typing import Any, Dict, Optional, Tuple

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# triggerSource -> logical template name. Edit only if you add/remove email types.
TRIGGER_TO_TEMPLATE: Dict[str, str] = {
    "CustomMessage_AdminCreateUser":     "cognito-admin-create-user",
    "CustomMessage_ForgotPassword":      "cognito-forgot-password",
    "CustomMessage_SignUp":              "cognito-signup",
    "CustomMessage_ResendCode":          "cognito-signup",
    "CustomMessage_UpdateUserAttribute": "cognito-attribute-verify",
    "CustomMessage_VerifyUserAttribute": "cognito-attribute-verify",
}

# Languages you ship templates for. Extend to add more (and add the .html files).
SUPPORTED_LANGS = ("es", "en")

_ses_client = None
_template_cache: Dict[str, Tuple[str, str, str]] = {}  # name -> (subject, html, text)


def _ses():
    global _ses_client
    if _ses_client is None:
        _ses_client = boto3.client("ses", region_name=os.getenv("AWS_REGION", "us-east-1"))
    return _ses_client


def _resolve_lang(attrs: Dict[str, Any]) -> str:
    default = os.getenv("DEFAULT_LANG", "es")
    locale = (attrs.get("locale") or "").lower()
    for lang in SUPPORTED_LANGS:
        if locale.startswith(lang):
            return lang
    return default


def _fetch_template(full_name: str) -> Optional[Tuple[str, str, str]]:
    """Return (subject, html, text) or None if the template doesn't exist."""
    if full_name in _template_cache:
        return _template_cache[full_name]
    try:
        resp = _ses().get_template(TemplateName=full_name)
    except ClientError as exc:
        code = exc.response.get("Error", {}).get("Code", "")
        if code in ("TemplateDoesNotExist", "InvalidTemplate"):
            logger.warning("SES template %s missing - falling back to Cognito default", full_name)
            return None
        logger.error("SES get_template(%s) failed: %s", full_name, exc)
        return None
    t = resp.get("Template", {})
    triplet = (t.get("SubjectPart") or "", t.get("HtmlPart") or "", t.get("TextPart") or "")
    _template_cache[full_name] = triplet
    return triplet


# Cognito uses `{####}` for the code and `{username}` for the username. Templates
# author the friendlier `{{code}}`/`{{username}}` so they stay browser-previewable.
_PLACEHOLDERS = (
    (re.compile(r"\{\{\s*code\s*\}\}"),     "{####}"),
    (re.compile(r"\{\{\s*username\s*\}\}"), "{username}"),
)


def _to_cognito_placeholders(s: str) -> str:
    out = s
    for pattern, replacement in _PLACEHOLDERS:
        out = pattern.sub(replacement, out)
    return out


def lambda_handler(event: Dict[str, Any], _context) -> Dict[str, Any]:
    if os.getenv("EMAIL_CUSTOMIZATION_ENABLED", "false").lower() != "true":
        return event
    trigger = event.get("triggerSource", "")
    attrs = (event.get("request", {}) or {}).get("userAttributes") or {}
    lang = _resolve_lang(attrs)
    env = os.getenv("ENVIRONMENT", "dev")
    prefix = os.getenv("TEMPLATE_PREFIX", "app")

    logger.info("cognito-templates: trigger=%s lang=%s env=%s pool=%s",
                trigger, lang, env, event.get("userPoolId"))

    response = event.setdefault("response", {})
    logical = TRIGGER_TO_TEMPLATE.get(trigger)
    if logical:
        full_name = f"{prefix}-{env}-{logical}-{lang}"
        triplet = _fetch_template(full_name)
        if triplet is not None:
            subject, html, _text = triplet
            response["emailSubject"] = _to_cognito_placeholders(subject)
            response["emailMessage"] = _to_cognito_placeholders(html)
        else:
            logger.warning("cognito-templates: no SES template %s — using Cognito stock email", full_name)

    return event
