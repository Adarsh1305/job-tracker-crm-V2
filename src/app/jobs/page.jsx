'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  Filter,
  SlidersHorizontal,
  ArrowUpDown,
  Download,
  Plus,
  ExternalLink,
  Building,
  MapPin,
  Briefcase,
  Columns,
  Eye,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Check,
  FileSpreadsheet,
  Trash2,
  Layers,
  AlertTriangle,
  CheckCircle2,
  X
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import StatusBadge from '@/components/StatusBadge';
import PriorityBadge from '@/components/PriorityBadge';
import MatchScoreBadge from '@/components/MatchScoreBadge';

export const dynamic = 'force-dynamic';

const ALL_COLUMNS = [
  { key: 'id', label: 'Job ID', default: true },
  { key: 'title', label: 'Job Title', default: true },
  { key: 'company', label: 'Company', default: true },
  { key: 'stage', label: 'Stage', default: true },
  { key: 'priority', label: 'Priority', default: true },
  { key: 'match_score', label: 'Match Score', default: true },
  { key: 'location', label: 'Location', default: true },
  { key: 'work_mode', label: 'Work Mode', default: true },
  { key: 'salary', label: 'Salary', default: true },
  { key: 'key_skills', label: 'Key Skills', default: false },
  { key: 'experience_required', label: 'Experience', default: false },
  { key: 'source', label: 'Source', default: true },
  { key: 'date_added', label: 'Date Added', default: false },
  { key: 'follow_up_date', label: 'Follow-up', default: true },
  { key: 'actions', label: 'Actions', default: true },
];

export default function JobsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <JobsTableContent />
    </Suspense>
  );
}

function JobsTableContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [jobs, setJobs] = useState([]);
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Filters & Sorting state
  const [search, setSearch] = useState(initialSearch);
  const [stageFilter, setStageFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [workModeFilter, setWorkModeFilter] = useState('all');
  const [minScore, setMinScore] = useState('');
  const [sortBy, setSortBy] = useState('match_score');
  const [sortDir, setSortDir] = useState('desc');
  const [density, setDensity] = useState('comfortable'); // 'comfortable' | 'compact'
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState(() => {
    return ALL_COLUMNS.reduce((acc, col) => {
      acc[col.key] = col.default;
      return acc;
    }, {});
  });
  const [showColumnPicker, setShowColumnPicker] = useState(false);

  // Multi-Selection State
  const [selectedJobIds, setSelectedJobIds] = useState(new Set());

  // Bulk Action Modals
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [stageModalOpen, setStageModalOpen] = useState(false);
  const [targetStageId, setTargetStageId] = useState('');
  const [confirmStageChange, setConfirmStageChange] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isBulkStaging, setIsBulkStaging] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        search,
        stage: stageFilter,
        priority: priorityFilter,
        workMode: workModeFilter,
        minScore,
        sortBy,
        sortDir,
        page: page.toString(),
        limit: limit.toString(),
      });

      const res = await fetch(`/api/jobs?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
        setTotal(data.total || 0);
        setStages(data.stages || []);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [search, stageFilter, priorityFilter, workModeFilter, minScore, sortBy, sortDir, page, limit]);

  useEffect(() => {
    const handleRefresh = () => fetchJobs();
    window.addEventListener('refresh-jobs', handleRefresh);
    return () => window.removeEventListener('refresh-jobs', handleRefresh);
  }, []);

  const openJobDetail = (jobId) => {
    window.dispatchEvent(new CustomEvent('open-job-detail', { detail: { jobId } }));
  };

  const handleQuickStageChange = async (e, jobId, newStage) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/jobs/${jobId}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      });
      if (res.ok) {
        fetchJobs();
        window.dispatchEvent(new CustomEvent('refresh-jobs'));
      }
    } catch (err) {
      console.error('Error updating stage:', err);
    }
  };

  const toggleSelectAll = () => {
    if (selectedJobIds.size === jobs.length) {
      setSelectedJobIds(new Set());
    } else {
      setSelectedJobIds(new Set(jobs.map(j => j.id)));
    }
  };

  const toggleSelectJob = (e, id) => {
    e.stopPropagation();
    const next = new Set(selectedJobIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedJobIds(next);
  };

  const handleSortByJobId = () => {
    if (sortBy === 'id') {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy('id');
      setSortDir('asc');
    }
    setPage(1);
  };

  const handleExportSelected = async () => {
    try {
      const res = await fetch('/api/export/excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobIds: Array.from(selectedJobIds) }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Selected_Jobs_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
        a.click();
        showToast(`Exported ${selectedJobIds.size} selected jobs to Excel.`, 'success');
      }
    } catch (e) {
      console.error('Export failed:', e);
      showToast('Export failed', 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedJobIds.size === 0) return;
    setIsBulkDeleting(true);
    try {
      const res = await fetch('/api/jobs/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobIds: Array.from(selectedJobIds) }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Successfully deleted ${data.deleted} job(s) from database.`, 'success');
        setSelectedJobIds(new Set());
        setDeleteModalOpen(false);
        fetchJobs();
        window.dispatchEvent(new CustomEvent('refresh-jobs'));
      } else {
        showToast(data.error || 'Failed to delete selected jobs.', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('An error occurred during deletion.', 'error');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleBulkChangeStage = async () => {
    if (selectedJobIds.size === 0 || !targetStageId) return;
    setIsBulkStaging(true);
    try {
      const res = await fetch('/api/jobs/bulk-stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobIds: Array.from(selectedJobIds),
          stage: targetStageId,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Moved ${data.updated} selected jobs to "${data.stageName}".`, 'success');
        setSelectedJobIds(new Set());
        setStageModalOpen(false);
        setConfirmStageChange(false);
        fetchJobs();
        window.dispatchEvent(new CustomEvent('refresh-jobs'));
      } else {
        showToast(data.error || 'Failed to update stages.', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('An error occurred during stage update.', 'error');
    } finally {
      setIsBulkStaging(false);
    }
  };

  return (
    <AppShell>
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-20 right-4 sm:right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200 ${
          toast.type === 'error'
            ? 'bg-rose-50 dark:bg-rose-950 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200'
            : 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-200'
        }`}>
          {toast.type === 'error' ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
          <span>{toast.text}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Job Opportunities</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold border border-brand-500/20">
              {total} positions
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Search, filter, multi-select, and track applications with real-time stage updates
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Column Visibility Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowColumnPicker(!showColumnPicker)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium transition-colors"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Columns</span>
            </button>

            {showColumnPicker && (
              <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-3 z-40 space-y-1 text-xs">
                <span className="font-bold text-[11px] text-slate-400 uppercase tracking-wider block mb-2">
                  Toggle Columns
                </span>
                {ALL_COLUMNS.map((col) => (
                  <label key={col.key} className="flex items-center gap-2 py-1 px-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!visibleColumns[col.key]}
                      onChange={() => setVisibleColumns(prev => ({ ...prev, [col.key]: !prev[col.key] }))}
                      className="rounded text-brand-600 focus:ring-brand-500"
                    />
                    <span>{col.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Density Toggle */}
          <button
            onClick={() => setDensity(density === 'comfortable' ? 'compact' : 'comfortable')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium transition-colors"
          >
            <span>{density === 'comfortable' ? 'Comfortable' : 'Compact'}</span>
          </button>
        </div>
      </div>

      {/* BULK ACTION TOOLBAR (Shown when 1+ jobs are selected) */}
      {selectedJobIds.size > 0 && (
        <div className="mb-4 p-3 rounded-2xl bg-brand-50/90 dark:bg-slate-900/90 border-2 border-brand-500/40 dark:border-brand-500/30 shadow-md backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <span className="flex h-7 px-2.5 rounded-lg bg-brand-600 text-white font-bold text-xs items-center justify-center shadow-xs">
              {selectedJobIds.size}
            </span>
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              {selectedJobIds.size === 1 ? '1 job selected' : `${selectedJobIds.size} jobs selected`}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
            <button
              onClick={() => {
                setTargetStageId(stages[0]?.id || 'new');
                setConfirmStageChange(false);
                setStageModalOpen(true);
              }}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Change Stage</span>
            </button>

            <button
              onClick={() => setDeleteModalOpen(true)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected</span>
            </button>

            <button
              onClick={handleExportSelected}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>

            <button
              onClick={() => setSelectedJobIds(new Set())}
              className="inline-flex items-center justify-center px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-medium transition-colors cursor-pointer"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 mb-6 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Live Search */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search title, company, skills, ID, notes..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-brand-500/30"
            />
          </div>

          {/* Stage Filter */}
          <div>
            <select
              value={stageFilter}
              onChange={(e) => {
                setStageFilter(e.target.value);
                setPage(1);
              }}
              className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
            >
              <option value="all">All Stages</option>
              {stages.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
              className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
            >
              <option value="all">All Priorities</option>
              <option value="high">🔥 High Priority</option>
              <option value="medium">⚡ Medium Priority</option>
              <option value="low">💤 Low Priority</option>
            </select>
          </div>

          {/* Work Mode Filter */}
          <div>
            <select
              value={workModeFilter}
              onChange={(e) => {
                setWorkModeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
            >
              <option value="all">All Work Modes</option>
              <option value="on-site">On-site</option>
              <option value="hybrid">Hybrid</option>
              <option value="remote">Remote</option>
            </select>
          </div>
        </div>

        {/* Secondary Filter Row: Min Score & Sort */}
        <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800 flex-wrap text-xs text-slate-500">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-semibold text-slate-400">Min Score:</span>
            {['', '85', '75', '60'].map((score) => (
              <button
                key={score}
                onClick={() => {
                  setMinScore(score);
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  minScore === score
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {score ? `≥ ${score}%` : 'Any'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-400">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="py-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
            >
              <option value="id">Job ID (Natural #)</option>
              <option value="match_score">Match Score</option>
              <option value="priority">Priority</option>
              <option value="title">Job Title</option>
              <option value="company">Company</option>
              <option value="date_added">Date Added</option>
            </select>
            <button
              onClick={() => {
                setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                setPage(1);
              }}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 text-slate-700 dark:text-slate-300"
              title="Toggle sort direction"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span className="text-[10px] font-mono uppercase font-bold">{sortDir}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400">Filtering jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No jobs match your filters</p>
            <p className="text-xs text-slate-400 mt-1">Try resetting search or adjusting minimum match score.</p>
            <button
              onClick={() => {
                setSearch('');
                setStageFilter('all');
                setPriorityFilter('all');
                setWorkModeFilter('all');
                setMinScore('');
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold text-slate-500 uppercase tracking-wider select-none">
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedJobIds.size === jobs.length && jobs.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
                      title={selectedJobIds.size === jobs.length ? 'Deselect all jobs' : 'Select all jobs on page'}
                    />
                  </th>
                  {visibleColumns.id && (
                    <th
                      onClick={handleSortByJobId}
                      className="py-3 px-3 cursor-pointer group hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                      title="Click to sort naturally by Job ID"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Job ID</span>
                        <ArrowUpDown className={`w-3.5 h-3.5 transition-colors ${sortBy === 'id' ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 group-hover:text-slate-600'}`} />
                        {sortBy === 'id' && (
                          <span className="text-[9px] font-mono text-brand-600 dark:text-brand-400 uppercase">
                            ({sortDir})
                          </span>
                        )}
                      </div>
                    </th>
                  )}
                  {visibleColumns.title && <th className="py-3 px-4">Title & Company</th>}
                  {visibleColumns.stage && <th className="py-3 px-3">Stage</th>}
                  {visibleColumns.priority && <th className="py-3 px-3">Priority</th>}
                  {visibleColumns.match_score && <th className="py-3 px-3">Match</th>}
                  {visibleColumns.location && <th className="py-3 px-3">Location</th>}
                  {visibleColumns.work_mode && <th className="py-3 px-3">Mode</th>}
                  {visibleColumns.salary && <th className="py-3 px-3">Salary</th>}
                  {visibleColumns.source && <th className="py-3 px-3">Source</th>}
                  {visibleColumns.follow_up_date && <th className="py-3 px-3">Follow-up</th>}
                  {visibleColumns.actions && <th className="py-3 px-3 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                {jobs.map((job) => {
                  const isSelected = selectedJobIds.has(job.id);
                  const pad = density === 'comfortable' ? 'py-3.5' : 'py-2';

                  return (
                    <tr
                      key={job.id}
                      onClick={() => openJobDetail(job.id)}
                      className={`hover:bg-brand-500/5 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${
                        isSelected ? 'bg-brand-500/10 dark:bg-brand-500/15' : ''
                      }`}
                    >
                      <td className={`${pad} px-4`} onClick={(e) => toggleSelectJob(e, job.id)}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
                        />
                      </td>

                      {visibleColumns.id && (
                        <td className={`${pad} px-3 font-mono font-semibold text-[11px] text-slate-500`}>
                          {job.id}
                        </td>
                      )}

                      {visibleColumns.title && (
                        <td className={`${pad} px-4 min-w-[200px] max-w-xs`}>
                          <div className="font-bold text-slate-900 dark:text-white truncate">
                            {job.title}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate flex items-center gap-1.5 mt-0.5">
                            <Building className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{job.company}</span>
                          </div>
                        </td>
                      )}

                      {visibleColumns.stage && (
                        <td className={`${pad} px-3`} onClick={(e) => e.stopPropagation()}>
                          <select
                            value={job.stage}
                            onChange={(e) => handleQuickStageChange(e, job.id, e.target.value)}
                            className="text-xs font-semibold py-1 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer"
                          >
                            {stages.map((s) => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        </td>
                      )}

                      {visibleColumns.priority && (
                        <td className={`${pad} px-3`}>
                          <PriorityBadge priority={job.priority} size="xs" />
                        </td>
                      )}

                      {visibleColumns.match_score && (
                        <td className={`${pad} px-3`}>
                          <MatchScoreBadge score={job.match_score} size="sm" />
                        </td>
                      )}

                      {visibleColumns.location && (
                        <td className={`${pad} px-3 text-slate-600 dark:text-slate-300 text-[11px] truncate max-w-[130px]`}>
                          {job.location}
                        </td>
                      )}

                      {visibleColumns.work_mode && (
                        <td className={`${pad} px-3 text-[11px] text-slate-600 dark:text-slate-300`}>
                          {job.work_mode}
                        </td>
                      )}

                      {visibleColumns.salary && (
                        <td className={`${pad} px-3 text-[11px] text-slate-600 dark:text-slate-300 truncate max-w-[120px]`}>
                          {job.salary || '—'}
                        </td>
                      )}

                      {visibleColumns.source && (
                        <td className={`${pad} px-3 text-[11px] text-slate-500 truncate max-w-[120px]`}>
                          {job.source}
                        </td>
                      )}

                      {visibleColumns.follow_up_date && (
                        <td className={`${pad} px-3 text-[11px] text-slate-500`}>
                          {job.follow_up_date ? (
                            <span className="font-semibold text-rose-500">
                              {job.follow_up_date}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      )}

                      {visibleColumns.actions && (
                        <td className={`${pad} px-3 text-right`} onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {job.application_url && (
                              <a
                                href={job.application_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Open apply link"
                                className="p-1.5 rounded-md text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button
                              onClick={() => openJobDetail(job.id)}
                              className="p-1.5 rounded-md text-slate-400 hover:text-brand-500 hover:bg-brand-500/10 text-xs font-semibold cursor-pointer"
                              title="View details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {total === 0 ? (
                'Showing 0 of 0 Jobs'
              ) : (
                `Showing ${limit === -1 ? 1 : (page - 1) * limit + 1}–${limit === -1 ? total : Math.min(page * limit, total)} of ${total} Jobs`
              )}
            </span>

            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-400">Rows per page:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(parseInt(e.target.value, 10));
                  setPage(1);
                }}
                className="py-1 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                <option value="10">10 / page</option>
                <option value="25">25 / page</option>
                <option value="50">50 / page</option>
                <option value="100">100 / page</option>
                <option value="-1">All ({total})</option>
              </select>
            </div>
          </div>

          {/* Numeric Page Buttons + Prev/Next */}
          {limit !== -1 && Math.ceil(total / limit) > 1 && (
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {(() => {
                const totalPages = Math.ceil(total / limit);
                const pageNumbers = [];
                if (totalPages <= 7) {
                  for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
                } else {
                  pageNumbers.push(1);
                  if (page > 3) pageNumbers.push('...');
                  const start = Math.max(2, page - 1);
                  const end = Math.min(totalPages - 1, page + 1);
                  for (let i = start; i <= end; i++) {
                    if (!pageNumbers.includes(i)) pageNumbers.push(i);
                  }
                  if (page < totalPages - 2) pageNumbers.push('...');
                  if (!pageNumbers.includes(totalPages)) pageNumbers.push(totalPages);
                }

                return pageNumbers.map((p, idx) => {
                  if (p === '...') {
                    return (
                      <span key={`dots-${idx}`} className="px-2 py-1 text-slate-400">
                        ...
                      </span>
                    );
                  }
                  const isCurrent = p === page;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`min-w-[28px] h-7 px-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                        isCurrent
                          ? 'bg-brand-600 text-white shadow-xs'
                          : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {p}
                    </button>
                  );
                });
              })()}

              <button
                disabled={page >= Math.ceil(total / limit)}
                onClick={() => setPage((prev) => prev + 1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CONFIRMATION DIALOG: DELETE SELECTED */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Delete {selectedJobIds.size} Selected Job{selectedJobIds.size > 1 ? 's' : ''}?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Are you sure you want to permanently remove {selectedJobIds.size} job opportunity record{selectedJobIds.size > 1 ? 's' : ''} and associated application data from the database? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isBulkDeleting}
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isBulkDeleting}
                onClick={handleBulkDelete}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {isBulkDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete {selectedJobIds.size} Jobs</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BULK CHANGE STAGE */}
      {stageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-600 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Bulk Change Application Stage
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Updating {selectedJobIds.size} selected job{selectedJobIds.size > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setStageModalOpen(false);
                  setConfirmStageChange(false);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!confirmStageChange ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Select the target workflow stage:
                </p>

                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                  {stages.map((stg) => {
                    const isSelected = targetStageId === stg.id;
                    return (
                      <div
                        key={stg.id}
                        onClick={() => setTargetStageId(stg.id)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-brand-500 bg-brand-500/10 ring-1 ring-brand-500/30'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: stg.color || '#3b82f6' }}
                          />
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-white block">
                              {stg.name}
                            </span>
                            {stg.description && (
                              <span className="text-[10px] text-slate-400 block line-clamp-1">
                                {stg.description}
                              </span>
                            )}
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-brand-600 dark:text-brand-400" />}
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStageModalOpen(false)}
                    className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!targetStageId}
                    onClick={() => setConfirmStageChange(true)}
                    className="flex-1 py-2 px-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Next: Confirm Stage
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
                  <p className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Please Confirm</span>
                  </p>
                  <p className="text-slate-700 dark:text-slate-300">
                    Move <strong className="text-slate-900 dark:text-white">{selectedJobIds.size}</strong> selected job(s) to <strong className="text-brand-600 dark:text-brand-400">{stages.find(s => s.id === targetStageId)?.name || targetStageId}</strong>?
                  </p>
                  <p className="text-[11px] text-slate-400 pt-1">
                    All other application data, notes, and metrics will be preserved.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isBulkStaging}
                    onClick={() => setConfirmStageChange(false)}
                    className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={isBulkStaging}
                    onClick={handleBulkChangeStage}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isBulkStaging ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <span>Change Stage</span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
