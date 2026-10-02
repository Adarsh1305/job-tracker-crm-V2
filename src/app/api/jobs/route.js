import { NextResponse } from 'next/server';
const db = require('@/lib/db');

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const stage = searchParams.get('stage') || 'all';
    const priority = searchParams.get('priority') || 'all';
    const classification = searchParams.get('classification') || 'all';
    const workMode = searchParams.get('workMode') || 'all';
    const minScore = searchParams.get('minScore') || '';
    const source = searchParams.get('source') || 'all';
    const sortBy = searchParams.get('sortBy') || 'match_score';
    const sortDir = searchParams.get('sortDir') || 'desc';

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limitParam = searchParams.get('limit') || searchParams.get('pageSize') || '25';
    const limit = parseInt(limitParam, 10);

    const allFiltered = db.getJoinedJobs({
      search,
      stage,
      priority,
      classification,
      workMode,
      minScore,
      source,
      sortBy,
      sortDir,
    });

    const total = allFiltered.length;
    const startIndex = limit === -1 ? 0 : (page - 1) * limit;
    const paginated = limit === -1 ? allFiltered : allFiltered.slice(startIndex, startIndex + limit);
    const totalPages = limit === -1 ? 1 : Math.max(1, Math.ceil(total / limit));

    // Get all stages
    const stages = db.getStages();

    // Calculate quick counts
    const allJobs = db.getJoinedJobs();
    const stageCounts = {};
    stages.forEach(s => { stageCounts[s.id] = 0; });
    allJobs.forEach(j => {
      stageCounts[j.stage] = (stageCounts[j.stage] || 0) + 1;
    });

    const databaseTotal = db.getJobs().length;

    return NextResponse.json({
      data: paginated,
      jobs: paginated,
      total,
      page,
      limit,
      pageSize: limit,
      totalPages,
      pagination: {
        page,
        pageSize: limit,
        total,
        totalPages,
      },
      databaseTotal,
      stages,
      stageCounts,
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const jobs = db.getJobs();

    const jobId = body.job_id || `JOB-2026-${String(jobs.length + 1).padStart(3, '0')}`;
    const nowIso = new Date().toISOString();

    const newJob = {
      id: jobId,
      job_id: jobId,
      title: body.title || 'Untitled Position',
      company: body.company || 'Unknown Company',
      location: body.location || 'Dubai, UAE',
      work_mode: body.work_mode || 'On-site',
      posted_date: body.posted_date || nowIso.split('T')[0],
      experience_required: body.experience_required || '3+ years',
      key_skills: body.key_skills || '',
      salary: body.salary || 'Not specified',
      match_classification: body.match_classification || '🟢 Good Match',
      match_score: parseInt(body.match_score || 80, 10),
      match_reason: body.match_reason || 'Manually added role matching profile stack',
      matching_skills: body.matching_skills || '',
      missing_requirements: body.missing_requirements || '',
      job_url: body.job_url || '',
      application_url: body.application_url || body.job_url || '',
      source: body.source || 'Manual Entry',
      alert_date: nowIso.split('T')[0],
      alert_time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      date_added: nowIso.split('T')[0],
    };

    db.saveJob(newJob);

    const newApp = {
      job_id: jobId,
      stage: body.stage || 'new',
      status_detail: body.status_detail || 'New',
      priority: body.priority || 'medium',
      applied_date: body.applied_date || (body.stage === 'applied' ? nowIso.split('T')[0] : ''),
      follow_up_date: body.follow_up_date || '',
      follow_up_type: body.follow_up_type || 'email',
      follow_up_status: 'pending',
      interview_date: body.interview_date || '',
      recruiter_name: body.recruiter_name || '',
      recruiter_email: body.recruiter_email || '',
      recruiter_phone: body.recruiter_phone || '',
      notes: body.notes || '',
      personal_rating: parseInt(body.personal_rating || 4, 10),
      resume_status: body.resume_status || 'Not Started',
      cover_letter_status: body.cover_letter_status || 'Not required',
      resume_version: body.resume_version || '',
      resume_file_link: body.resume_file_link || '',
    };

    db.saveApplication(newApp, false);

    db.addActivityLog({
      job_id: jobId,
      type: 'discovered',
      title: `Job Manually Created: ${newJob.title} at ${newJob.company}`,
      description: `Added to CRM under stage: ${newApp.stage}.`,
      user: 'Adarsh Vinothan',
    });

    return NextResponse.json({ success: true, job: { ...newJob, application: newApp } });
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
