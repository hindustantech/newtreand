import { NextResponse } from 'next/server';
import { clearAuthCookie } from '../../../../lib/auth.js';
import { requireCsrf } from '../../../../lib/csrf.js';

export async function POST(request) {
  const csrfDenied = await requireCsrf(request);
  if (csrfDenied) return csrfDenied;
  await clearAuthCookie();
  return NextResponse.json({ ok: true });
}