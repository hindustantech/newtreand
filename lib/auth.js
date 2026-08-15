import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { connectToDatabase, toObjectId } from './mongodb.js';

const TOKEN_NAME = 'satrang_token';
const TOKEN_MAX_AGE = 60 * 60 * 24 * 7;

function getSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not set in .env.local');
  }
  return new TextEncoder().encode(process.env.JWT_SECRET);
}

export async function signToken(userId) {
  return new SignJWT({ sub: String(userId) })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret());
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload.sub || null;
  } catch {
    return null;
  }
}

export async function setAuthCookie(userId) {
  const token = await signToken(userId);
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: TOKEN_MAX_AGE,
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

export async function getCurrentUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function getCurrentUser() {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  const db = await connectToDatabase();
  const user = await db.collection('users').findOne(
    { _id: toObjectId(userId) },
    { projection: { passwordHash: 0 } },
  );
  return user;
}