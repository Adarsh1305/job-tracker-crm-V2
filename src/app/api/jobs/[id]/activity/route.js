import { NextResponse } from 'next/server';
const db = require('@/lib/db');

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const logs = db.getActivityLogs(id);
    return NextResponse.json({ activities: logs });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { type, title, description, timestamp } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const entry = db.addActivityLog({
      job_id: id,
      type: type || 'note',
      title,
      description: description || '',
      timestamp: timestamp || new Date().toISOString(),
      user: 'Adarsh Vinothan',
    });

    return NextResponse.json({ success: true, activity: entry });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
