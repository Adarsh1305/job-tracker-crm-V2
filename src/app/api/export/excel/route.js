import { NextResponse } from 'next/server';
const xlsx = require('xlsx');
const db = require('@/lib/db');

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      stage = 'all',
      priority = 'all',
      classification = 'all',
      workMode = 'all',
      search = '',
      minScore = '',
      jobIds = [],
    } = body;

    let jobs = db.getJoinedJobs({
      stage,
      priority,
      classification,
      workMode,
      search,
      minScore,
    });

    if (jobIds && jobIds.length > 0) {
      const idSet = new Set(jobIds.map(id => id.toUpperCase()));
      jobs = jobs.filter(j => idSet.has(j.id.toUpperCase()));
    }

    // Build Excel export rows
    const exportData = jobs.map((j, index) => {
      const app = j.application || {};
      return {
        '#': index + 1,
        'Job ID': j.id,
        'Job Title': j.title,
        'Company': j.company,
        'Location': j.location,
        'Work Mode': j.work_mode,
        'Application Stage': j.stage_name || j.stage,
        'Priority': (app.priority || 'medium').toUpperCase(),
        'Match Score': `${j.match_score || 0}%`,
        'Match Classification': j.match_classification,
        'Salary': j.salary,
        'Posted Date': j.posted_date,
        'Date Added': j.date_added,
        'Applied Date': app.applied_date || '',
        'Follow-up Date': app.follow_up_date || '',
        'Follow-up Status': app.follow_up_status || '',
        'Interview Date': app.interview_date || '',
        'Experience Required': j.experience_required,
        'Key Technologies': j.key_skills,
        'Matching Skills': j.matching_skills,
        'Missing Requirements': j.missing_requirements,
        'Match Reason': j.match_reason,
        'Job URL': j.job_url,
        'Application URL': j.application_url,
        'Source': j.source,
        'Resume Status': app.resume_status || '',
        'Cover Letter Status': app.cover_letter_status || '',
        'Recruiter Contact': [app.recruiter_name, app.recruiter_email, app.recruiter_phone].filter(Boolean).join(' | '),
        'Notes': app.notes || '',
      };
    });

    const worksheet = xlsx.utils.json_to_sheet(exportData);

    // Auto-fit column widths
    const columnKeys = Object.keys(exportData[0] || {});
    worksheet['!cols'] = columnKeys.map(k => ({
      wch: Math.max(k.length + 4, 14),
    }));

    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Job Applications');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const todayStr = new Date().toISOString().split('T')[0];
    const fileName = `Job_Applications_Export_${todayStr}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Export Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request) {
  // Support quick GET download
  return POST(request);
}
