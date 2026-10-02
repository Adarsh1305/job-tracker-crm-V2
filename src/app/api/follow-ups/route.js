import { NextResponse } from 'next/server';
const db = require('@/lib/db');

export async function GET() {
  try {
    const followUps = db.getFollowUps();
    return NextResponse.json(followUps);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { jobId, followUpDate, followUpType, followUpStatus, notes } = body;

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    const job = db.getJobById(jobId);
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const app = job.application;
    const updatedApp = db.saveApplication({
      ...app,
      follow_up_date: followUpDate !== undefined ? followUpDate : app.follow_up_date,
      follow_up_type: followUpType || app.follow_up_type || 'email',
      follow_up_status: followUpStatus || app.follow_up_status || 'pending',
      notes: notes !== undefined ? notes : app.notes,
    }, false);

    if (followUpStatus === 'completed') {
      db.addActivityLog({
        job_id: jobId,
        type: 'follow_up',
        title: `Follow-up completed for ${job.title} at ${job.company}`,
        description: `Follow-up marked as completed. Notes: ${notes || 'Done'}`,
        user: 'Adarsh Vinothan'
      });
    }

    return NextResponse.json({ success: true, application: updatedApp });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
