import { NextResponse } from 'next/server';
const { verifySessionToken } = require('@/lib/auth');
const db = require('@/lib/db');

export async function GET(request) {
  try {
    const cookie = request.cookies.get('auth_token');
    const session = verifySessionToken(cookie?.value);

    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const profile = db.getProfile();
    return NextResponse.json({
      authenticated: true,
      user: {
        email: session.email,
        name: profile.name,
        title: profile.title,
        location: profile.location,
      },
    });
  } catch (error) {
    return NextResponse.json({ authenticated: false, error: error.message }, { status: 500 });
  }
}
