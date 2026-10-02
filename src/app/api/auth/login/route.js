import { NextResponse } from 'next/server';
const { validateCredentials, createSessionToken } = require('@/lib/auth');
const db = require('@/lib/db');

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!validateCredentials(email, password)) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const profile = db.getProfile();
    const token = createSessionToken({ email, name: profile.name });

    const response = NextResponse.json({
      success: true,
      user: {
        email,
        name: profile.name,
        title: profile.title,
      },
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
