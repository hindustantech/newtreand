import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const CSRF_COOKIE = 'satrang_csrf';
const CSRF_HEADER = 'x-csrf-token';
const CSRF_MAX_AGE = 60 * 60 * 24 * 7;

export async function ensureCsrfCookie() {
  const cookieStore = await cookies();
  let token = cookieStore.get(CSRF_COOKIE)?.value;
  if (!token) {
    token = randomBytes(24).toString('hex');
    cookieStore.set(CSRF_COOKIE, token, {
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: CSRF_MAX_AGE,
    });
  }
  return token;
}

export async function verifyCsrf(request) {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(CSRF_COOKIE)?.value;
  const header = request.headers.get(CSRF_HEADER);
  if (!cookie || !header || cookie.length < 16) return false;
  return cookie === header;
}

// Ensures the cookie exists (so the client can read it), then checks the
// double-submit token. Returns null when valid, otherwise a 403 response.
export async function requireCsrf(request) {
  await ensureCsrfCookie();
  const ok = await verifyCsrf(request);
  if (ok) return null;
  return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
}
