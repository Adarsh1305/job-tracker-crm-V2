import { NextResponse } from 'next/server';
const db = require('@/lib/db');

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stages = db.getStages();
    const counts = db.getStageJobCounts();
    return NextResponse.json({ stages, counts });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: 'Stage name is required' }, { status: 400 });
    }

    const created = db.addStage({
      name: body.name.trim(),
      description: body.description || '',
      color: body.color || '#6366f1',
      badge: body.badge || '',
      order: body.order,
    });

    db.addActivityLog({
      type: 'stage_created',
      title: `Created Stage: ${created.name}`,
      description: `Custom stage "${created.name}" added to the application workflow.`,
      user: 'Adarsh Vinothan',
    });

    return NextResponse.json({ success: true, stage: created, stages: db.getStages() });
  } catch (error) {
    console.error('Error creating stage:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();

    // If updating the whole list (e.g. reordering)
    if (Array.isArray(body.stages)) {
      const saved = db.saveStages(body.stages);
      return NextResponse.json({ success: true, stages: saved });
    }

    // If updating a single stage
    if (body.stageId && body.stage) {
      const saved = db.updateStage(body.stageId, body.stage);
      return NextResponse.json({ success: true, stages: saved });
    }

    return NextResponse.json({ error: 'Invalid stage update payload' }, { status: 400 });
  } catch (error) {
    console.error('Error saving stages:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const stageId = searchParams.get('id');
    const migrateTo = searchParams.get('migrateTo');

    if (!stageId) {
      return NextResponse.json({ error: 'stage ID is required' }, { status: 400 });
    }

    const counts = db.getStageJobCounts();
    const jobsInStage = counts[stageId] || 0;

    if (jobsInStage > 0 && !migrateTo) {
      return NextResponse.json({
        error: `This stage is currently used by ${jobsInStage} job(s). Choose another stage before removing it.`,
        jobsCount: jobsInStage,
        requiresMigration: true,
      }, { status: 400 });
    }

    const result = db.deleteStage(stageId, migrateTo);

    db.addActivityLog({
      type: 'stage_deleted',
      title: `Removed Stage: ${result.deletedStage?.name || stageId}`,
      description: result.migratedCount > 0
        ? `Removed stage and migrated ${result.migratedCount} job(s) to another stage.`
        : `Removed custom stage from workflow.`,
      user: 'Adarsh Vinothan',
    });

    return NextResponse.json({
      success: true,
      migratedCount: result.migratedCount,
      stages: db.getStages(),
    });
  } catch (error) {
    console.error('Error deleting stage:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
