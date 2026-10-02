import { NextResponse } from 'next/server';
const db = require('@/lib/db');

export async function GET() {
  try {
    const profile = db.getProfile();
    return NextResponse.json({ profile });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const updated = db.saveProfile(body);
    return NextResponse.json({ success: true, profile: updated });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
