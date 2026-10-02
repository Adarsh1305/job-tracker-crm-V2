import { NextResponse } from 'next/server';
const db = require('@/lib/db');

export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { stage, note } = body;

    if (!stage) {
      return NextResponse.json({ error: 'Stage is required' }, { status: 400 });
    }

    const updatedApp = db.updateJobStage(id, stage, note);
    const updatedJob = db.getJobById(id);

    return NextResponse.json({
      success: true,
      job: updatedJob,
      application: updatedApp,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
