import { NextResponse } from 'next/server';
const db = require('@/lib/db');

export async function POST() {
  try {
    const res = db.reseed();
    return NextResponse.json({ success: true, message: `Reset and reseeded ${res.count} jobs from reference tracker.` });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
