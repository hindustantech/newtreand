import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../../lib/mongodb.js';
import { setAuthCookie } from '../../../../../lib/auth.js';
import { createRateLimit, clientKey } from '../../../../../lib/rate-limit.js';
import { consumeOAuthState, exchangeCodeForProfile } from '../../../../../lib/google-auth.js';

const callbackLimiter = createRateLimit({ windowMs: 15 * 60 * 1000, max: 20 });

export async function GET(request) {
  const url = new URL(request.url);
  const home = new URL('/', url.origin);
  const fail = () => {
    home.searchParams.set('auth', 'error');
    return NextResponse.redirect(home);
  };

  try {
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    if (error || !code || !state) return fail();

    const limited = callbackLimiter(clientKey(request));
    if (!limited.allowed) return fail();

    const verifier = await consumeOAuthState(state);
    if (!verifier) return fail();

    const profile = await exchangeCodeForProfile(request, code, verifier);
    if (!profile) return fail();

    const db = await connectToDatabase();
    const users = db.collection('users');

    let user = await users.findOne({ googleId: profile.googleId });
    if (!user) {
      user = await users.findOne({ email: profile.email });
      if (user) {
        await users.updateOne(
          { _id: user._id },
          { $set: { googleId: profile.googleId, name: profile.name, picture: profile.picture } },
        );
      } else {
        const result = await users.insertOne({
          googleId: profile.googleId,
          email: profile.email,
          name: profile.name,
          picture: profile.picture,
          createdAt: new Date(),
        });
        user = { _id: result.insertedId };
      }
    } else {
      await users.updateOne(
        { _id: user._id },
        { $set: { email: profile.email, name: profile.name, picture: profile.picture } },
      );
    }

    await setAuthCookie(user._id.toString());
    return NextResponse.redirect(home);
  } catch (err) {
    console.error('Google OAuth callback failed:', err);
    return fail();
  }
}