import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '../../../../lib/mongodb.js';
import { setAuthCookie } from '../../../../lib/auth.js';
import { requireCsrf } from '../../../../lib/csrf.js';
import { createRateLimit, clientKey } from '../../../../lib/rate-limit.js';

const loginLimiter = createRateLimit({ windowMs: 15 * 60 * 1000, max: 10 });

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const csrfDenied = await requireCsrf(request);
  if (csrfDenied) return csrfDenied;

  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  const limited = loginLimiter(`${clientKey(request)}:${email}`);
  if (!limited.allowed) {
    return NextResponse.json(
      { error: `Too many attempts, try again in ${limited.retryAfter}s` },
      { status: 429 },
    );
  }

  const db = await connectToDatabase();
  const user = await db.collection('users').findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  await setAuthCookie(user._id.toString());

  return NextResponse.json({ user: { id: user._id.toString(), email: user.email } });
}