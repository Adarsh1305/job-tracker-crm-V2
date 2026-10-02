import { NextResponse } from 'next/server';
const db = require('@/lib/db');

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { jobIds, stage } = await request.json();

    if (!Array.isArray(jobIds) || jobIds.length === 0) {
      return NextResponse.json({ error: 'jobIds array is required' }, { status: 400 });
    }
    if (!stage) {
      return NextResponse.json({ error: 'stage is required' }, { status: 400 });
    }

    // Validate stage exists
    const stages = db.getStages();
    const targetStage = stages.find((s) => s.id === stage);
    if (!targetStage) {
      return NextResponse.json({ error: `Invalid stage: ${stage}` }, { status: 400 });
    }

    let updated = 0;
    const errors = [];

    for (const jobId of jobIds) {
      try {
        db.updateJobStage(jobId, stage);
        updated++;
      } catch (e) {
        errors.push({ jobId, error: e.message });
      }
    }

    // Log activity
    db.addActivityLog({
      type: 'bulk_stage_change',
      title: `Bulk stage change: ${updated} job(s) → ${targetStage.name}`,
      description: `Changed application stage to "${targetStage.name}" for ${updated} job(s).`,
      user: 'Adarsh Vinothan',
    });

    return NextResponse.json({
      success: true,
      updated,
      stageName: targetStage.name,
      errors,
    });
  } catch (error) {
    console.error('Bulk stage change error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
