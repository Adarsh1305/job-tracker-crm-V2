'use client';

import React, { useState, useEffect } from 'react';
import {
  KanbanSquare,
  Search,
  Filter,
  Plus,
  Building,
  MapPin,
  Briefcase,
  DollarSign,
  Clock,
  ExternalLink,
  ChevronRight,
  Flame,
  ArrowRight
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import StatusBadge from '@/components/StatusBadge';
import PriorityBadge from '@/components/PriorityBadge';
import MatchScoreBadge from '@/components/MatchScoreBadge';

export default function KanbanPage() {
  const [stages, setStages] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [workModeFilter, setWorkModeFilter] = useState('all');

  // Drag and drop state
  const [draggedJobId, setDraggedJobId] = useState(null);
  const [dragOverStageId, setDragOverStageId] = useState(null);

  const loadKanbanData = async () => {
    setLoading(true);
    try {
      const [stagesRes, jobsRes] = await Promise.all([
        fetch('/api/stages'),
        fetch('/api/jobs?limit=-1'), // get all jobs for board
      ]);
      if (stagesRes.ok) {
        const sData = await stagesRes.json();
        setStages(sData.stages || []);
      }
      if (jobsRes.ok) {
        const jData = await jobsRes.json();
        setJobs(jData.jobs || []);
      }
    } catch (e) {
      console.error('Error loading kanban:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKanbanData();
    const handleRefresh = () => loadKanbanData();
    window.addEventListener('refresh-jobs', handleRefresh);
    return () => window.removeEventListener('refresh-jobs', handleRefresh);
  }, []);

  const openJobDetail = (jobId) => {
    window.dispatchEvent(new CustomEvent('open-job-detail', { detail: { jobId } }));
  };

  // Filter jobs
  const filteredJobs = jobs.filter((job) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        job.title.toLowerCase().includes(q) ||
        job.company.toLowerCase().includes(q) ||
        job.location.toLowerCase().includes(q) ||
        job.id.toLowerCase().includes(q) ||
        job.key_skills.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (priorityFilter !== 'all' && job.priority !== priorityFilter) {
      return false;
    }
    if (workModeFilter !== 'all' && !job.work_mode.toLowerCase().includes(workModeFilter.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Group jobs by stage
  const jobsByStage = {};
  stages.forEach((s) => {
    jobsByStage[s.id] = [];
  });
  filteredJobs.forEach((j) => {
    if (jobsByStage[j.stage]) {
      jobsByStage[j.stage].push(j);
    } else {
      if (!jobsByStage['new']) jobsByStage['new'] = [];
      jobsByStage['new'].push(j);
    }
  });

  // Drag and drop handlers
  const handleDragStart = (e, jobId) => {
    setDraggedJobId(jobId);
    e.dataTransfer.setData('text/plain', jobId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, stageId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStageId !== stageId) {
      setDragOverStageId(stageId);
    }
  };

  const handleDragLeave = (e, stageId) => {
    if (dragOverStageId === stageId) {
      setDragOverStageId(null);
    }
  };

  const handleDrop = async (e, targetStageId) => {
    e.preventDefault();
    setDragOverStageId(null);
    const jobId = draggedJobId || e.dataTransfer.getData('text/plain');
    if (!jobId || !targetStageId) return;

    // Optimistic UI update
    setJobs((prevJobs) =>
      prevJobs.map((j) => (j.id === jobId ? { ...j, stage: targetStageId } : j))
    );

    try {
      const res = await fetch(`/api/jobs/${jobId}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: targetStageId }),
      });
      if (res.ok) {
        window.dispatchEvent(new CustomEvent('refresh-jobs'));
      }
    } catch (err) {
      console.error('Failed to update stage on drop:', err);
      loadKanbanData(); // revert
    } finally {
      setDraggedJobId(null);
    }
  };

  return (
    <AppShell>
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Kanban Pipeline</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-500/20">
              Drag & Drop
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Drag cards between columns to advance stages and record automatic timeline history
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter board cards..."
              className="pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-brand-500/30"
            />
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="py-1.5 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Priorities</option>
            <option value="high">🔥 High</option>
            <option value="medium">⚡ Medium</option>
            <option value="low">💤 Low</option>
          </select>

          <select
            value={workModeFilter}
            onChange={(e) => setWorkModeFilter(e.target.value)}
            className="py-1.5 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Modes</option>
            <option value="on-site">On-site</option>
            <option value="hybrid">Hybrid</option>
            <option value="remote">Remote</option>
          </select>
        </div>
      </div>

      {/* Kanban Board Horizontal Scroll Container */}
      <div className="overflow-x-auto pb-6 kanban-scroll -mx-4 px-4 sm:-mx-6 sm:px-6">
        <div className="flex items-start gap-4 min-w-max">
          {stages.map((stg) => {
            const stageJobs = jobsByStage[stg.id] || [];
            const isDropTarget = dragOverStageId === stg.id;

            return (
              <div
                key={stg.id}
                onDragOver={(e) => handleDragOver(e, stg.id)}
                onDragLeave={(e) => handleDragLeave(e, stg.id)}
                onDrop={(e) => handleDrop(e, stg.id)}
                className={`w-72 sm:w-80 rounded-2xl bg-slate-100/70 dark:bg-slate-900/60 border transition-all duration-200 flex flex-col max-h-[calc(100vh-210px)] ${
                  isDropTarget
                    ? 'border-brand-500 ring-2 ring-brand-500/20 bg-brand-500/5'
                    : 'border-slate-200/80 dark:border-slate-800'
                }`}
              >
                {/* Column Header */}
                <div className="p-3.5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: stg.color || '#3b82f6' }}
                    />
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {stg.name}
                    </h3>
                  </div>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
                    {stageJobs.length}
                  </span>
                </div>

                {/* Cards List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {stageJobs.length === 0 ? (
                    <div className="py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center">
                      <p className="text-[11px] text-slate-400">No jobs in {stg.name}</p>
                      <p className="text-[10px] text-slate-400/80 mt-0.5">Drop cards here</p>
                    </div>
                  ) : (
                    stageJobs.map((job) => {
                      const isDragging = draggedJobId === job.id;

                      return (
                        <div
                          key={job.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, job.id)}
                          onClick={() => openJobDetail(job.id)}
                          className={`p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:shadow-md hover:border-brand-500/40 dark:hover:border-brand-500/40 cursor-grab active:cursor-grabbing transition-all select-none group ${
                            isDragging ? 'opacity-40 scale-95 border-dashed border-brand-500' : ''
                          }`}
                        >
                          {/* Card Top: Match Score & Priority */}
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="font-mono text-[10px] font-semibold text-slate-400">
                              {job.id}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <PriorityBadge priority={job.priority} size="xs" />
                              <MatchScoreBadge score={job.match_score} size="sm" />
                            </div>
                          </div>

                          {/* Title & Company */}
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug group-hover:text-brand-500 transition-colors line-clamp-2">
                            {job.title}
                          </h4>

                          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 font-medium mt-1">
                            <Building className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{job.company}</span>
                          </div>

                          {/* Details Badges */}
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-2 flex-wrap">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span className="truncate max-w-[100px]">{job.location}</span>
                            </span>
                            <span>•</span>
                            <span className="truncate max-w-[80px]">{job.work_mode}</span>
                          </div>

                          {/* Salary if available */}
                          {job.salary && job.salary !== 'Not specified' && (
                            <div className="mt-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 truncate">
                              💰 {job.salary}
                            </div>
                          )}

                          {/* Follow-up / Application Date Footer */}
                          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400">
                            {job.follow_up_date ? (
                              <span className="flex items-center gap-1 text-rose-500 font-semibold">
                                <Clock className="w-3 h-3" />
                                <span>Due: {job.follow_up_date}</span>
                              </span>
                            ) : job.applied_date ? (
                              <span>Applied: {job.applied_date}</span>
                            ) : (
                              <span>via {job.source}</span>
                            )}

                            <span className="text-slate-400 group-hover:text-brand-500 flex items-center gap-0.5">
                              <span>Open</span>
                              <ChevronRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
