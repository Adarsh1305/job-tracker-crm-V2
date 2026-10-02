'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  AlertCircle,
  Calendar,
  CheckCircle2,
  Building,
  Mail,
  Phone,
  MessageSquare,
  Plus,
  ExternalLink,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import StatusBadge from '@/components/StatusBadge';
import PriorityBadge from '@/components/PriorityBadge';
import MatchScoreBadge from '@/components/MatchScoreBadge';

export default function FollowUpsPage() {
  const [data, setData] = useState({ overdue: [], today: [], upcoming: [], completed: [], all: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'completed' | 'all'

  const loadFollowUps = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/follow-ups');
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch (e) {
      console.error('Error loading follow-ups:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFollowUps();
    const handleRefresh = () => loadFollowUps();
    window.addEventListener('refresh-jobs', handleRefresh);
    return () => window.removeEventListener('refresh-jobs', handleRefresh);
  }, []);

  const openJobDetail = (jobId) => {
    window.dispatchEvent(new CustomEvent('open-job-detail', { detail: { jobId } }));
  };

  const handleToggleStatus = async (jobId, newStatus) => {
    try {
      const res = await fetch('/api/follow-ups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, followUpStatus: newStatus }),
      });
      if (res.ok) {
        loadFollowUps();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const overdue = data.overdue || [];
  const today = data.today || [];
  const upcoming = data.upcoming || [];
  const completed = data.completed || [];

  return (
    <AppShell>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Follow-up Command Center</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold border border-rose-500/20">
              {overdue.length + today.length} Actions Due
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Keep recruiter conversations warm and never let an application slip through the cracks
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'active'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Pending ({overdue.length + today.length + upcoming.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'completed'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Completed ({completed.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Loading follow-ups...</p>
        </div>
      ) : activeTab === 'active' ? (
        <div className="space-y-6">
          {/* SECTION 1: OVERDUE */}
          {overdue.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-rose-500 font-bold text-xs uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4" />
                <span>Overdue Follow-ups ({overdue.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {overdue.map((job) => (
                  <FollowUpCard
                    key={job.id}
                    job={job}
                    isOverdue={true}
                    onOpen={() => openJobDetail(job.id)}
                    onComplete={() => handleToggleStatus(job.id, 'completed')}
                  />
                ))}
              </div>
            </div>
          )}

          {/* SECTION 2: TODAY */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-wider">
              <Clock className="w-4 h-4" />
              <span>Due Today ({today.length})</span>
            </div>
            {today.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-400 text-center">
                No follow-ups scheduled for today.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {today.map((job) => (
                  <FollowUpCard
                    key={job.id}
                    job={job}
                    isToday={true}
                    onOpen={() => openJobDetail(job.id)}
                    onComplete={() => handleToggleStatus(job.id, 'completed')}
                  />
                ))}
              </div>
            )}
          </div>

          {/* SECTION 3: UPCOMING */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-wider">
              <Calendar className="w-4 h-4" />
              <span>Upcoming Follow-ups ({upcoming.length})</span>
            </div>
            {upcoming.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-400 text-center">
                No upcoming follow-ups scheduled. Click on any job to schedule a follow-up.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {upcoming.map((job) => (
                  <FollowUpCard
                    key={job.id}
                    job={job}
                    onOpen={() => openJobDetail(job.id)}
                    onComplete={() => handleToggleStatus(job.id, 'completed')}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* COMPLETED TAB */
        <div className="space-y-3">
          {completed.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              No completed follow-ups yet. Mark items as completed when done!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {completed.map((job) => (
                <FollowUpCard
                  key={job.id}
                  job={job}
                  isCompleted={true}
                  onOpen={() => openJobDetail(job.id)}
                  onComplete={() => handleToggleStatus(job.id, 'pending')}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}

function FollowUpCard({ job, isOverdue, isToday, isCompleted, onOpen, onComplete }) {
  const app = job.application || {};

  return (
    <div
      onClick={onOpen}
      className={`p-4 rounded-xl border transition-all cursor-pointer bg-white dark:bg-slate-900 shadow-xs hover:shadow-md ${
        isOverdue
          ? 'border-rose-500/30 ring-1 ring-rose-500/20'
          : isToday
          ? 'border-amber-500/30 ring-1 ring-amber-500/20'
          : 'border-slate-200/80 dark:border-slate-800'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-mono text-[10px] text-slate-400">{job.id}</span>
            <StatusBadge stage={job.stage} name={job.stage_name} size="xs" />
            <PriorityBadge priority={job.priority} size="xs" />
          </div>
          <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
            {job.title}
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate flex items-center gap-1 mt-0.5">
            <Building className="w-3 h-3 text-slate-400" />
            <span>{job.company}</span>
          </p>
        </div>

        <div className="text-right shrink-0">
          <span
            className={`text-xs font-bold block ${
              isOverdue
                ? 'text-rose-500'
                : isToday
                ? 'text-amber-500'
                : isCompleted
                ? 'text-emerald-500'
                : 'text-slate-700 dark:text-slate-300'
            }`}
          >
            {job.follow_up_date || 'No Date'}
          </span>
          <span className="text-[10px] text-slate-400 capitalize">
            via {app.follow_up_type || 'Email'}
          </span>
        </div>
      </div>

      {app.notes && (
        <p className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg mt-2.5 line-clamp-2">
          {app.notes}
        </p>
      )}

      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <span className="text-[10px] text-slate-400">
          Recruiter: {app.recruiter_name || 'Not assigned'}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onComplete();
          }}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
            isCompleted
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
              : 'bg-emerald-600 text-white hover:bg-emerald-500'
          }`}
        >
          {isCompleted ? 'Mark Pending' : 'Mark Completed ✓'}
        </button>
      </div>
    </div>
  );
}
