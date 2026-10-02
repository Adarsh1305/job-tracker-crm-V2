import { NextResponse } from 'next/server';
const db = require('@/lib/db');

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const job = db.getJobById(id);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const activityLogs = db.getActivityLogs(job.id);

    return NextResponse.json({
      job,
      activityLogs,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const existing = db.getJobById(id);

    if (!existing) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Update external job fields if provided
    if (body.job) {
      db.saveJob({
        ...existing,
        ...body.job,
        id: existing.id,
      });
    }

    // Update application fields if provided
    if (body.application) {
      db.saveApplication({
        ...existing.application,
        ...body.application,
        job_id: existing.id,
      }, true);
    }

    const updated = db.getJobById(id);
    return NextResponse.json({ success: true, job: updated });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const res = db.deleteJob(id);
    return NextResponse.json(res);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
