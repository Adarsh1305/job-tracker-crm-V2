import { NextResponse } from 'next/server';
const db = require('@/lib/db');

export async function GET() {
  try {
    const logs = db.getSyncLogs();
    return NextResponse.json({ logs });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
