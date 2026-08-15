import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../lib/auth.js';
import { ensureCsrfCookie } from '../../../../lib/csrf.js';

export async function GET() {
  const user = await getCurrentUser();
  await ensureCsrfCookie();
  if (!user) {
    return NextResponse.json({ user: null });
  }
  return NextResponse.json({ user: { id: user._id.toString(), email: user.email } });
}