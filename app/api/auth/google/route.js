import { NextResponse } from 'next/server';
import { buildGoogleAuthUrl } from '../../../../lib/google-auth.js';

export async function GET(request) {
  const authUrl = await buildGoogleAuthUrl(request);
  return NextResponse.redirect(authUrl);
}