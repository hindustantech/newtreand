import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '../../../../lib/mongodb.js';
import { setAuthCookie } from '../../../../lib/auth.js';
import { requireCsrf } from '../../../../lib/csrf.js';
import { createRateLimit, clientKey } from '../../../../lib/rate-limit.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const registerLimiter = createRateLimit({ windowMs: 60 * 60 * 1000, max: 20 });

export async function POST(request) {
  const csrfDenied = await requireCsrf(request);
  if (csrfDenied) return csrfDenied;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  const limited = registerLimiter(`${clientKey(request)}:${email}`);
  if (!limited.allowed) {
    return NextResponse.json(
      { error: `Too many attempts, try again in ${limited.retryAfter}s` },
      { status: 429 },
    );
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
  }

  const db = await connectToDatabase();
  const existing = await db.collection('users').findOne({ email });
  if (existing) {
    return NextResponse.json(
      { error: existing.googleId && !existing.passwordHash
        ? 'An account with this email already exists. Try signing in with Google.'
        : 'An account with this email already exists' },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await db.collection('users').insertOne({ email, passwordHash, createdAt: new Date() });
  await setAuthCookie(result.insertedId.toString());

  return NextResponse.json(
    { user: { id: result.insertedId.toString(), email, name: null, picture: null } },
    { status: 201 },
  );
}