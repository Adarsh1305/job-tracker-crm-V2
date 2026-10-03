import { NextResponse } from 'next/server';
const db = require('@/lib/db');

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const { jobIds } = body;

    // const { jobIds } = await request.json();

    if (!Array.isArray(jobIds) || jobIds.length === 0) {
      return NextResponse.json(
        { error: 'jobIds array is required' },
        { status: 400 },
      );
    }

    let deleted = 0;
    const errors = [];

    for (const jobId of jobIds) {
      try {
        const result = db.deleteJob(jobId);

        if (result.success && result.deleted) {
          deleted++;
        } else {
          errors.push({
            jobId,
            error: result.error || 'Job not found',
          });
        }

        // db.deleteJob(jobId);
        // deleted++;
      } catch (e) {
        errors.push({ jobId, error: e.message });
      }
    }

    // Log activity
    // db.addActivityLog({
    //   type: 'bulk_delete',
    //   title: `Bulk deleted ${deleted} job(s)`,
    //   description: `Removed ${deleted} job record(s) from the database.`,
    //   user: 'Adarsh Vinothan',
    // });

    if (deleted > 0) {
      db.addActivityLog({
        type: 'bulk_delete',
        title: `Bulk deleted ${deleted} job(s)`,
        description: `Removed ${deleted} job record(s) from the database.`,
        user: 'Adarsh Vinothan',
      });
    }

    return NextResponse.json({
      success: true,
      requested: jobIds.length,
      deleted,
      failed: errors.length,
      errors,
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
