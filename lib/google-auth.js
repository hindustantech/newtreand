import { createRemoteJWKSet, jwtVerify } from 'jose';
import { createHash, randomBytes } from 'crypto';
import { cookies } from 'next/headers';

const OAUTH_COOKIE = 'satrang_oauth_state';
const OAUTH_COOKIE_MAX_AGE = 10 * 60;
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_CERTS_URL = 'https://www.googleapis.com/oauth2/v3/certs';

const googleKeys = createRemoteJWKSet(new URL(GOOGLE_CERTS_URL));

function getClientId() {
  return process.env.GOOGLE_CLIENT_ID || process.env.Google_Client_ID || '';
}

function getClientSecret() {
  return process.env.GOOGLE_CLIENT_SECRET || process.env.Google_Client_Secret || '';
}

function base64UrlEncode(buffer) {
  return Buffer.from(buffer)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function getGoogleRedirectUri(request) {
  if (process.env.GOOGLE_REDIRECT_URI) return process.env.GOOGLE_REDIRECT_URI;
  const url = new URL(request.url);
  return `${url.origin}/api/auth/google/callback`;
}

export async function buildGoogleAuthUrl(request) {
  const state = randomBytes(24).toString('hex');
  const verifier = base64UrlEncode(randomBytes(32));
  const challenge = base64UrlEncode(createHash('sha256').update(verifier).digest());

  const cookieStore = await cookies();
  cookieStore.set(OAUTH_COOKIE, JSON.stringify({ state, verifier }), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: OAUTH_COOKIE_MAX_AGE,
  });

  const params = new URLSearchParams({
    client_id: getClientId(),
    redirect_uri: getGoogleRedirectUri(request),
    response_type: 'code',
    scope: 'openid email profile',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    access_type: 'online',
    prompt: 'select_account',
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function consumeOAuthState(state) {
  const cookieStore = await cookies();
  const raw = cookieStore.get(OAUTH_COOKIE)?.value;
  cookieStore.set(OAUTH_COOKIE, '', { path: '/', maxAge: 0 });
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.state || parsed.state !== state || !parsed.verifier) return null;
    return parsed.verifier;
  } catch {
    return null;
  }
}

export async function exchangeCodeForProfile(request, code, verifier) {
  const params = new URLSearchParams({
    code,
    client_id: getClientId(),
    client_secret: getClientSecret(),
    redirect_uri: getGoogleRedirectUri(request),
    grant_type: 'authorization_code',
    code_verifier: verifier,
  });

  let tokenRes;
  try {
    tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      cache: 'no-store',
    });
  } catch {
    return null;
  }
  if (!tokenRes.ok) return null;

  const tokenData = await tokenRes.json();
  const idToken = tokenData.id_token;
  if (!idToken) return null;

  let payload;
  try {
    const result = await jwtVerify(idToken, googleKeys, {
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      audience: getClientId(),
      algorithms: ['RS256'],
    });
    payload = result.payload;
  } catch {
    return null;
  }

  if (!payload.email || !payload.email_verified) return null;

  return {
    googleId: String(payload.sub),
    email: String(payload.email).toLowerCase(),
    name: payload.name || '',
    picture: payload.picture || '',
  };
}