import { NextResponse } from 'next/server';
const db = require('@/lib/db');

export const dynamic = 'force-dynamic';

function getStartOfDay(d) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getEndOfDay(d) {
  const date = new Date(d);
  date.setHours(23, 59, 59, 999);
  return date;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const preset =
      searchParams.get('preset') || searchParams.get('range') || 'all';
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    const allJobs = db.getJoinedJobs();
    const stages = db.getStages();
    const syncLogs = db.getSyncLogs();
    const activityLogs = db.getActivityLogs();
    const followUps = db.getFollowUps();

    // Determine filter range
    const now = new Date();
    let filterStart = null;
    let filterEnd = null;
    let displayLabel = 'All Time';

    if (preset === 'today') {
      filterStart = getStartOfDay(now);
      filterEnd = getEndOfDay(now);
      displayLabel = 'Today';
    } else if (preset === 'yesterday') {
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      filterStart = getStartOfDay(yesterday);
      filterEnd = getEndOfDay(yesterday);
      displayLabel = 'Yesterday';
    } else if (preset === '7d') {
      filterStart = getStartOfDay(
        new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      );
      filterEnd = getEndOfDay(now);
      displayLabel = 'Last 7 Days';
    } else if (preset === '30d') {
      filterStart = getStartOfDay(
        new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      );
      filterEnd = getEndOfDay(now);
      displayLabel = 'Last 30 Days';
    } else if (preset === 'this_month') {
      filterStart = new Date(now.getFullYear(), now.getMonth(), 1);
      filterEnd = getEndOfDay(now);
      displayLabel = 'This Month';
    } else if (preset === 'prev_month') {
      filterStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      filterEnd = new Date(
        now.getFullYear(),
        now.getMonth(),
        0,
        23,
        59,
        59,
        999,
      );
      displayLabel = 'Previous Month';
    } else if (startDateParam) {
      filterStart = getStartOfDay(startDateParam);
      filterEnd = endDateParam
        ? getEndOfDay(endDateParam)
        : getEndOfDay(startDateParam);
      displayLabel = `${filterStart.toISOString().split('T')[0]} → ${filterEnd.toISOString().split('T')[0]}`;
    }

    const isDateInRange = (dateVal) => {
      if (!filterStart || !filterEnd) return true;
      if (!dateVal) return false;
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return false;
      return d >= filterStart && d <= filterEnd;
    };

    // 1. Jobs Added Metric (Uses job created_at / date_added / posted_date)
    const jobsAddedList = allJobs.filter((j) => {
      const d = j.created_at || j.date_added || j.posted_date;
      return isDateInRange(d);
    });

    // 2. Applications Metric (Uses application applied_date or updated_at when stage is applied)
    const applicationsList = allJobs.filter((j) => {
      const app = j.application || {};
      const appliedDate =
        app.applied_date ||
        (j.stage === 'applied' ? app.updated_at || j.created_at : null);
      return isDateInRange(appliedDate);
    });

    // 3. Interviews Metric (Uses interview_date or interview stage)
    const interviewStages = ['interview', 'tech_interview', 'hr_interview'];
    const interviewsList = allJobs.filter((j) => {
      const app = j.application || {};
      const intDate =
        app.interview_date ||
        (interviewStages.includes(j.stage)
          ? app.updated_at || j.created_at
          : null);
      return isDateInRange(intDate);
    });

    // 4. Offers Metric (Uses offer_date or offer stage)
    const offersList = allJobs.filter((j) => {
      const app = j.application || {};
      const offerDate =
        app.offer_date ||
        (j.stage === 'offer' ? app.updated_at || j.created_at : null);
      return isDateInRange(offerDate);
    });

    // 5. Rejections Metric
    const rejectionsList = allJobs.filter((j) => {
      const app = j.application || {};
      const rejDate =
        j.stage === 'rejected' ? app.updated_at || j.created_at : null;
      return isDateInRange(rejDate);
    });

    // 6. Activity Logs (Uses activity.timestamp)
    const filteredActivities = activityLogs.filter((act) =>
      isDateInRange(act.timestamp),
    );

    // 7. Follow-ups (Uses follow_up_date)
    const filteredFollowUps = allJobs.filter((j) =>
      isDateInRange(j.follow_up_date),
    );

    // 8. Stage Counts for Current View
    // If date filter is applied, compute stage distribution among jobs added in that range
    const primaryJobs = filterStart ? jobsAddedList : allJobs;
    const stageCounts = {};
    stages.forEach((s) => {
      stageCounts[s.id] = { id: s.id, name: s.name, count: 0, color: s.color };
    });
    primaryJobs.forEach((j) => {
      if (stageCounts[j.stage]) {
        stageCounts[j.stage].count++;
      } else {
        stageCounts[j.stage] = {
          id: j.stage,
          name: j.stage,
          count: 1,
          color: '#94a3b8',
        };
      }
    });

    // 9. Funnel Stages with appropriate date metrics
    // const funnelStages = [
    //   {
    //     id: 'new',
    //     name: 'Discovered',
    //     count: filterStart ? jobsAddedList.length : allJobs.length,
    //     metric: 'Jobs added within date range',
    //   },
    //   {
    //     id: 'applied',
    //     name: 'Applied',
    //     count: applicationsList.length,
    //     metric: 'Applications submitted within date range',
    //   },
    //   {
    //     id: 'interview',
    //     name: 'Interview',
    //     count: interviewsList.length,
    //     metric: 'Interviews scheduled within date range',
    //   },
    //   {
    //     id: 'offer',
    //     name: 'Offer',
    //     count: offersList.length,
    //     metric: 'Offers received within date range',
    //   },
    // ];

    const funnelStages = [
      { id: 'new', name: 'Discovered', count: 0 },
      { id: 'interested', name: 'Interested', count: 0 },
      { id: 'preparing', name: 'Preparing', count: 0 },
      { id: 'applied', name: 'Applied', count: 0 },
      { id: 'screening', name: 'Screening', count: 0 },
      { id: 'interview', name: 'Interview', count: 0 },
      { id: 'offer', name: 'Offer', count: 0 },
    ];

    funnelStages.forEach((fs) => {
      if (fs.id === 'interview') {
        fs.count =
          (stageCounts['interview']?.count || 0) +
          (stageCounts['tech_interview']?.count || 0) +
          (stageCounts['hr_interview']?.count || 0);
      } else if (fs.id === 'new') {
        fs.count = primaryJobs.length; // total discovered
      } else {
        fs.count = stageCounts[fs.id]?.count || 0;
      }
    });

    // 10. Match Score Distribution
    const matchDistribution = {
      strong: { label: 'Strong Match (≥85%)', count: 0, color: '#ef4444' },
      good: { label: 'Good Match (70–84%)', count: 0, color: '#10b981' },
      related: {
        label: 'Related Opportunity (50–69%)',
        count: 0,
        color: '#3b82f6',
      },
      other: { label: 'Low / Other (<50%)', count: 0, color: '#94a3b8' },
    };

    primaryJobs.forEach((j) => {
      const score = j.match_score || 0;
      if (score >= 85) matchDistribution.strong.count++;
      else if (score >= 70) matchDistribution.good.count++;
      else if (score >= 50) matchDistribution.related.count++;
      else matchDistribution.other.count++;
    });

    // 11. Location Distribution
    const locationCounts = {};
    primaryJobs.forEach((j) => {
      let loc = (j.location || 'Unknown').trim();
      if (loc.includes('Dubai')) loc = 'Dubai, UAE';
      else if (loc.includes('Abu Dhabi')) loc = 'Abu Dhabi, UAE';
      else if (loc.includes('Sharjah')) loc = 'Sharjah, UAE';
      else if (loc.toLowerCase().includes('remote')) loc = 'Remote';
      locationCounts[loc] = (locationCounts[loc] || 0) + 1;
    });

    const locationList = Object.entries(locationCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    // 12. Source Distribution
    const sourceCounts = {};
    primaryJobs.forEach((j) => {
      let src = (j.source || 'Other').trim();
      if (src.includes('Dr. Job')) src = 'Dr. Job';
      else if (src.includes('Bayt')) src = 'Bayt';
      else if (src.includes('Indeed')) src = 'Indeed';
      else if (src.includes('GulfTalent')) src = 'GulfTalent';
      else if (src.includes('HubMub')) src = 'HubMub';
      else if (src.includes('LinkedIn')) src = 'LinkedIn';
      sourceCounts[src] = (sourceCounts[src] || 0) + 1;
    });

    const sourceList = Object.entries(sourceCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    // 13. Work Mode Distribution
    const workModeCounts = {};
    primaryJobs.forEach((j) => {
      let wm = (j.work_mode || 'On-site').toLowerCase();
      if (wm.includes('remote')) wm = 'Remote';
      else if (wm.includes('hybrid')) wm = 'Hybrid';
      else wm = 'On-site';
      workModeCounts[wm] = (workModeCounts[wm] || 0) + 1;
    });

    const workModeList = Object.entries(workModeCounts).map(
      ([name, value]) => ({ name, value }),
    );

    // 14. Discovery Timeline
    const timelineCounts = {};
    primaryJobs.forEach((j) => {
      const date =
        j.alert_date ||
        j.date_added ||
        (j.created_at ? j.created_at.split('T')[0] : '2026-09-25');
      timelineCounts[date] = (timelineCounts[date] || 0) + 1;
    });

    const discoveryTimeline = Object.entries(timelineCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 15. Summary Stats with explicit metric mapping
    // const stats = {
    //   totalJobs: primaryJobs.length,
    //   jobsAdded: jobsAddedList.length,
    //   applied: applicationsList.length,
    //   interviews: interviewsList.length,
    //   offers: offersList.length,
    //   rejected: rejectionsList.length,
    //   activitiesRecorded: filteredActivities.length,
    //   followUpsDueInRange: filteredFollowUps.length,
    //   averageMatchScore: Math.round(
    //     primaryJobs.reduce((acc, j) => acc + (j.match_score || 0), 0) /
    //       (primaryJobs.length || 1),
    //   ),
    //   highPriority: primaryJobs.filter((j) => j.priority === 'high').length,
    // };

    // 15. Summary Stats with explicit metric mapping
    const stats = {
      totalJobs: primaryJobs.length,
      jobsAdded: stageCounts['new']?.count || 0,
      applied: stageCounts['applied']?.count || 0,
      interviews:
        (stageCounts['interview']?.count || 0) +
        (stageCounts['tech_interview']?.count || 0) +
        (stageCounts['hr_interview']?.count || 0),
      offers: stageCounts['offer']?.count || 0,
      rejected: stageCounts['rejected']?.count || 0,
      followUpsDueInRange: filteredFollowUps.length,
      followUpDue: followUps.overdue.length + followUps.today.length,
      averageMatchScore: Math.round(
        primaryJobs.reduce((acc, j) => acc + (j.match_score || 0), 0) /
          (primaryJobs.length || 1),
      ),
      highPriority: primaryJobs.filter((j) => j.priority === 'high').length,
    };

    return NextResponse.json({
      stats,
      stageCounts: Object.values(stageCounts),
      funnel: funnelStages,
      matchDistribution: Object.values(matchDistribution),
      locationList,
      sourceList,
      workModeList,
      discoveryTimeline,
      dateFilterInfo: {
        preset,
        startDate: filterStart ? filterStart.toISOString().split('T')[0] : null,
        endDate: filterEnd ? filterEnd.toISOString().split('T')[0] : null,
        displayLabel,
        metricDefinitions: {
          jobsAdded:
            'Filtered by Job Discovery/Created date (created_at / date_added)',
          applications:
            'Filtered by Application Submission date (applied_date)',
          interviews:
            'Filtered by Interview date (interview_date / stage update)',
          offers: 'Filtered by Offer date (offer_date / stage update)',
          rejections: 'Filtered by Rejection date (stage update)',
          activity: 'Filtered by Activity log timestamp',
          followUps: 'Filtered by Follow-up action due date',
        },
      },
      lastSync: syncLogs[0] || null,
    });
  } catch (error) {
    console.error('Analytics calculation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
