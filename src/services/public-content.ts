// Guest IAM requests to the courses API.
//
// The public gateway is AWS_IAM: a visitor gets short-lived GUEST credentials from a Cognito
// identity pool (no user pool, no sign-up) and signs each GET with SigV4. Everything here is
// plain fetch + WebCrypto (browser and Node 18+), no SDK. The guest role may only call
// published GET endpoints and POST /api/public/activity; the pool id is public configuration.
//
// Sites render at once from cachedPublishedContent() (the last copy this browser saw) or their
// bundled src/content/*.json, then call loadPublishedContent() in the background and re-render
// only when the published documents differ (stale-while-revalidate: a cold API never delays
// the first paint).

export interface PublicApiConfig {
  /** Base URL, e.g. https://courses-api.linux.jcampos.dev */
  url: string;
  identityPoolId: string;
  region?: string;
}

interface GuestCredentials {
  accessKeyId: string;
  secretKey: string;
  sessionToken: string;
  /** epoch ms */
  expiration: number;
}

const ID_KEY = "linux-lab-curriculum-identity";
const encoder = new TextEncoder();

function storage(kind: "local" | "session"): Storage | null {
  try {
    return typeof window === "undefined" ? null : kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

async function cognitoIdentity<T>(region: string, target: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`https://cognito-identity.${region}.amazonaws.com/`, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/x-amz-json-1.1", "X-Amz-Target": `AWSCognitoIdentityService.${target}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Cognito identity ${target} failed (${res.status})`);
  return res.json() as Promise<T>;
}

let memoryCredentials: GuestCredentials | null = null;

async function guestCredentials(config: PublicApiConfig, signal?: AbortSignal): Promise<GuestCredentials> {
  const region = config.region ?? config.identityPoolId.split(":")[0];
  const fresh = (c: GuestCredentials | null) => c && c.expiration - Date.now() > 60_000;
  if (fresh(memoryCredentials)) return memoryCredentials!;
  // Reuse the visitor's guest identity id (no personal data; one id per browser).
  let identityId = storage("local")?.getItem(ID_KEY) ?? null;
  const fetchCredentials = async () => {
    if (!identityId) {
      identityId = (await cognitoIdentity<{ IdentityId: string }>(region, "GetId", { IdentityPoolId: config.identityPoolId }, signal)).IdentityId;
      storage("local")?.setItem(ID_KEY, identityId);
    }
    return cognitoIdentity<{ Credentials: { AccessKeyId: string; SecretKey: string; SessionToken: string; Expiration: number } }>(
      region, "GetCredentialsForIdentity", { IdentityId: identityId }, signal);
  };
  let result;
  try {
    result = await fetchCredentials();
  } catch {
    identityId = null; // a stale/removed identity: start a new one once
    result = await fetchCredentials();
  }
  const c = result.Credentials;
  memoryCredentials = { accessKeyId: c.AccessKeyId, secretKey: c.SecretKey, sessionToken: c.SessionToken, expiration: c.Expiration * 1000 };

  return memoryCredentials;
}

const hex = (buffer: ArrayBuffer) => [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
const sha256 = async (text: string) => hex(await crypto.subtle.digest("SHA-256", encoder.encode(text)));

async function hmac(key: BufferSource, text: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(text));
}

const encodeSegment = (segment: string) =>
  encodeURIComponent(segment).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

/** SigV4-signed GET for API Gateway (service execute-api). */
export function signedPublicGet(config: PublicApiConfig, path: string, init: { signal?: AbortSignal } = {}): Promise<Response> {
  return signedPublicRequest(config,path,init);
}
export async function signedPublicRequest(config: PublicApiConfig, path: string, init: { signal?: AbortSignal; method?: 'GET'|'POST'; body?: string } = {}): Promise<Response> {
  const method=init.method??'GET', body=init.body??'';
  const credentials = await guestCredentials(config, init.signal);
  const region = config.region ?? config.identityPoolId.split(":")[0];
  const url = new URL(path, config.url.replace(/\/+$/, "") + "/");
  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
  const date = amzDate.slice(0, 8);
  const canonicalUri = url.pathname.split("/").map((s) => encodeSegment(decodeURIComponent(s))).join("/");
  const canonicalQuery = [...url.searchParams.entries()]
    .map(([k, v]) => [encodeSegment(k), encodeSegment(v)])
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  const signedHeaders = "host;x-amz-date;x-amz-security-token";
  const canonicalRequest = [
    method, canonicalUri, canonicalQuery,
    `host:${url.host}\nx-amz-date:${amzDate}\nx-amz-security-token:${credentials.sessionToken}\n`,
    signedHeaders, await sha256(body),
  ].join("\n");
  const scope = `${date}/${region}/execute-api/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, await sha256(canonicalRequest)].join("\n");
  let key: ArrayBuffer = await hmac(encoder.encode(`AWS4${credentials.secretKey}`), date);
  for (const part of [region, "execute-api", "aws4_request"]) key = await hmac(key, part);
  const signature = hex(await hmac(key, stringToSign));
  return fetch(url.toString(), {
    method,
    ...(method==='POST'?{body}:{}),
    signal: init.signal,
    headers: {
      ...(method==='POST'?{'Content-Type':'application/json'}:{}),
      "X-Amz-Date": amzDate,
      "X-Amz-Security-Token": credentials.sessionToken,
      Authorization: `AWS4-HMAC-SHA256 Credential=${credentials.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    },
  });
}
