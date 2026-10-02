'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Send,
  Users,
  Award,
  Clock,
  Flame,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Building,
  MapPin,
  ExternalLink,
  RefreshCw,
  Sparkles,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import SetupWizard from '@/components/SetupWizard';
import StatusBadge from '@/components/StatusBadge';
import PriorityBadge from '@/components/PriorityBadge';
import MatchScoreBadge from '@/components/MatchScoreBadge';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [followUps, setFollowUps] = useState({ overdue: [], today: [], upcoming: [] });
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      const [analyticsRes, jobsRes, followUpsRes] = await Promise.all([
        fetch('/api/analytics'),
        fetch('/api/jobs?limit=6&sortBy=created_at&sortDir=desc'),
        fetch('/api/follow-ups'),
      ]);

      if (analyticsRes.ok) {
        const aData = await analyticsRes.json();
        setData(aData);
      }

      if (jobsRes.ok) {
        const jData = await jobsRes.json();
        setRecentJobs(jData.jobs || []);
      }

      if (followUpsRes.ok) {
        const fData = await followUpsRes.json();
        setFollowUps(fData);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    const handleRefresh = () => loadDashboardData();
    window.addEventListener('refresh-jobs', handleRefresh);
    return () => window.removeEventListener('refresh-jobs', handleRefresh);
  }, []);

  const openJobDetail = (jobId) => {
    window.dispatchEvent(new CustomEvent('open-job-detail', { detail: { jobId } }));
  };

  const markFollowUpComplete = async (jobId) => {
    try {
      const res = await fetch('/api/follow-ups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, followUpStatus: 'completed' }),
      });
      if (res.ok) {
        loadDashboardData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const stats = data?.stats || {};

  return (
    <AppShell>
      {/* Setup Wizard for Guided Onboarding */}
      <SetupWizard onDismiss={() => {}} />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Job Search Command Center</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
              Live Tracker
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tracking Dubai full-stack opportunities synced via automated Google Sheet & Excel tracker
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/kanban"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
          >
            <span>Kanban Board</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-xs font-semibold text-white transition-colors shadow-xs"
          >
            <span>All Jobs ({stats.totalJobs ?? 0})</span>
          </Link>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
        {/* Metric 1 */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Jobs</span>
            <Briefcase className="w-4 h-4 text-brand-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {stats.totalJobs || 0}
          </p>
          <span className="text-[10px] text-slate-400 mt-1 block">In database</span>
        </div>

        {/* Metric 2 */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">New Leads</span>
            <Sparkles className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
            {stats.newJobs || 0}
          </p>
          <span className="text-[10px] text-slate-400 mt-1 block">To be reviewed</span>
        </div>

        {/* Metric 3 */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Applied</span>
            <Send className="w-4 h-4 text-cyan-500" />
          </div>
          <p className="text-2xl font-black text-cyan-600 dark:text-cyan-400">
            {stats.applied || 0}
          </p>
          <span className="text-[10px] text-slate-400 mt-1 block">Submitted apps</span>
        </div>

        {/* Metric 4 */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Interviews</span>
            <Users className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {stats.interviews || 0}
          </p>
          <span className="text-[10px] text-slate-400 mt-1 block">Tech & HR rounds</span>
        </div>

        {/* Metric 5 */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Offers</span>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {stats.offers || 0}
          </p>
          <span className="text-[10px] text-slate-400 mt-1 block">Target goal</span>
        </div>

        {/* Metric 6 */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Follow-ups</span>
            <Clock className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400">
            {stats.followUpDue || 0}
          </p>
          <span className="text-[10px] text-rose-500 font-semibold mt-1 block">Due or overdue</span>
        </div>
      </div>

      {/* Application Funnel Visualizer */}
      <div className="mb-6 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-500" />
              <span>Job Application Funnel</span>
            </h2>
            <p className="text-[11px] text-slate-400">Progression from discovery to offer</p>
          </div>
          <span className="text-xs font-mono font-semibold text-slate-500">
            Avg Match Score: {stats.averageMatchScore || 77}%
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {data?.funnel?.map((step, idx) => (
            <div
              key={step.id}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 relative group hover:border-brand-500/50 transition-colors"
            >
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span className="font-mono text-[10px]">0{idx + 1}</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white">{step.count}</span>
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                {step.name}
              </p>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-brand-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(8, (step.count / (stats.totalJobs || 1)) * 100))}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Follow-ups & Recent Jobs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Follow-up Reminders Alert Box */}
          {(followUps.overdue.length > 0 || followUps.today.length > 0) ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-slate-900 dark:text-slate-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                    Follow-ups Requiring Immediate Action
                  </span>
                </div>
                <Link href="/follow-ups" className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-semibold">
                  View all ({stats.followUpDue}) →
                </Link>
              </div>

              <div className="space-y-2">
                {[...followUps.overdue, ...followUps.today].slice(0, 3).map((j) => (
                  <div
                    key={j.id}
                    className="p-3 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-rose-500/20 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white truncate">{j.title}</p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {j.company} • Due: {j.follow_up_date}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => openJobDetail(j.id)}
                        className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-medium hover:bg-slate-200"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => markFollowUpComplete(j.id)}
                        className="px-2.5 py-1 rounded bg-emerald-600 text-white text-[11px] font-semibold hover:bg-emerald-500"
                      >
                        Done ✓
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>All scheduled follow-ups are up to date! Great job!</span>
              </div>
              <Link href="/follow-ups" className="font-semibold underline">
                Manage Follow-ups
              </Link>
            </div>
          )}

          {/* Recent Opportunities */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Opportunities</h3>
                <p className="text-[11px] text-slate-400">Latest jobs captured in the tracker</p>
              </div>
              <Link href="/jobs" className="text-xs font-semibold text-brand-500 hover:text-brand-400 flex items-center gap-1">
                <span>View All Table</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {recentJobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => openJobDetail(job.id)}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {job.title}
                      </span>
                      <PriorityBadge priority={job.priority} size="xs" />
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 flex-wrap">
                      <span className="text-slate-600 dark:text-slate-300 font-medium">{job.company}</span>
                      <span>•</span>
                      <span>{job.location}</span>
                      <span>•</span>
                      <span>{job.work_mode}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <MatchScoreBadge score={job.match_score} size="sm" />
                    <StatusBadge stage={job.stage} name={job.stage_name} size="xs" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Match Distribution, Sources & Quick Actions */}
        <div className="space-y-6">
          {/* Match Score Distribution */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Match Distribution
            </h3>
            <p className="text-[11px] text-slate-400 mb-4">
              Calibrated to Adarsh's full-stack stack
            </p>

            <div className="space-y-3">
              {data?.matchDistribution?.map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-300 font-medium">{item.label}</span>
                    <span className="font-bold text-slate-900 dark:text-white">{item.count}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: item.color,
                        width: `${Math.max(5, (item.count / (stats.totalJobs || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Sources */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Top Discovery Portals
            </h3>
            <p className="text-[11px] text-slate-400 mb-3">Job alert automation sources</p>

            <div className="space-y-2">
              {data?.sourceList?.slice(0, 5).map((src) => (
                <div key={src.name} className="flex items-center justify-between text-xs py-1">
                  <span className="text-slate-700 dark:text-slate-300 truncate max-w-[180px]">
                    {src.name}
                  </span>
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {src.value} jobs
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Sync Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-600/10 via-indigo-600/10 to-slate-900 border border-brand-500/20 text-xs">
            <div className="flex items-center gap-2 mb-2 text-brand-500 font-bold">
              <RefreshCw className="w-4 h-4" />
              <span>Google Sheets Sync Rule</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
              When daily Google Sheet updates arrive, external job details are updated while all your
              manually managed stages, notes, and recruiter logs remain 100% intact.
            </p>
            <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex justify-between items-center">
              <span className="text-[10px] text-slate-400">Strict personal field protection</span>
              <Link href="/integrations/google-sheets" className="text-brand-500 font-semibold hover:underline">
                Sync Settings →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
