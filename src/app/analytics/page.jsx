'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Calendar,
  Layers,
  MapPin,
  Globe,
  Briefcase,
  Flame,
  Award,
  CheckCircle,
  XCircle,
  Filter,
  Info,
  CalendarDays,
  RotateCcw,
  ChevronDown
} from 'lucide-react';
import AppShell from '@/components/AppShell';

export default function AnalyticsPage() {
  const [preset, setPreset] = useState('all'); // 'today', 'yesterday', '7d', '30d', 'this_month', 'prev_month', 'custom', 'all'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [customActive, setCustomActive] = useState(false);
  const [showMetricInfo, setShowMetricInfo] = useState(false);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async (customStart = null, customEnd = null) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (customActive && (customStart || startDate)) {
        params.set('preset', 'custom');
        params.set('startDate', customStart || startDate);
        if (customEnd || endDate) params.set('endDate', customEnd || endDate);
      } else {
        params.set('preset', preset);
      }

      const res = await fetch(`/api/analytics?${params.toString()}`);
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch (e) {
      console.error('Error fetching analytics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!customActive) {
      fetchAnalytics();
    }
  }, [preset]);

  const handleApplyCustomRange = (e) => {
    e.preventDefault();
    if (!startDate) return;
    setCustomActive(true);
    fetchAnalytics(startDate, endDate || startDate);
  };

  const handleClearFilter = () => {
    setPreset('all');
    setStartDate('');
    setEndDate('');
    setCustomActive(false);
  };

  const stats = data?.stats || {};
  const stageCounts = data?.stageCounts || [];
  const funnel = data?.funnel || [];
  const matchDist = data?.matchDistribution || [];
  const locationList = data?.locationList || [];
  const sourceList = data?.sourceList || [];
  const workModeList = data?.workModeList || [];
  const timeline = data?.discoveryTimeline || [];
  const dateFilterInfo = data?.dateFilterInfo || {};

  const maxStageCount = Math.max(...stageCounts.map(s => s.count), 1);
  const maxTimelineCount = Math.max(...timeline.map(t => t.count), 1);

  const PRESETS = [
    { id: 'all', label: 'All Time' },
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: '7d', label: 'Last 7 Days' },
    { id: '30d', label: 'Last 30 Days' },
    { id: 'this_month', label: 'This Month' },
    { id: 'prev_month', label: 'Previous Month' },
  ];

  return (
    <AppShell>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Job Search Analytics</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold border border-brand-500/20">
              Live Metrics
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Data-driven insights on conversion rates, skill matching, and portal effectiveness
          </p>
        </div>

        {/* Selected Date Range Badge & Clear Action */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold shadow-xs">
            <CalendarDays className="w-3.5 h-3.5 text-brand-500 shrink-0" />
            <span className="text-slate-500 dark:text-slate-400">Range:</span>
            <span className="text-slate-900 dark:text-white">
              {dateFilterInfo.displayLabel || 'All Time'}
            </span>
          </div>

          {(preset !== 'all' || customActive) && (
            <button
              onClick={handleClearFilter}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-xs font-semibold transition-colors cursor-pointer"
              title="Reset date filter to All Time"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear Filter</span>
            </button>
          )}

          <button
            onClick={() => setShowMetricInfo(!showMetricInfo)}
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            title="View metric date mapping details"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* METRIC DATE MAPPING EXPLANATION (Requirement 5) */}
      {showMetricInfo && (
        <div className="mb-5 p-4 rounded-2xl bg-brand-50/70 dark:bg-brand-950/30 border border-brand-200/80 dark:border-brand-800/60 text-xs animate-in fade-in duration-150">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Info className="w-4 h-4 text-brand-500" />
              <span>How Date Filtering Applies to Specific Metrics:</span>
            </h4>
            <button onClick={() => setShowMetricInfo(false)} className="text-slate-400 hover:text-slate-600">×</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-[11px]">
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="font-bold text-brand-600 dark:text-brand-400 block mb-0.5">Jobs Added</span>
              <p className="text-slate-500 dark:text-slate-400">Calculated by job discovery date (<code className="font-mono">created_at</code> / <code className="font-mono">date_added</code>)</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="font-bold text-cyan-600 dark:text-cyan-400 block mb-0.5">Applications</span>
              <p className="text-slate-500 dark:text-slate-400">Calculated by official submission date (<code className="font-mono">applied_date</code>)</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="font-bold text-amber-600 dark:text-amber-400 block mb-0.5">Interviews</span>
              <p className="text-slate-500 dark:text-slate-400">Calculated by scheduled/held interview date (<code className="font-mono">interview_date</code>)</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="font-bold text-emerald-600 dark:text-emerald-400 block mb-0.5">Activity & Follow-ups</span>
              <p className="text-slate-500 dark:text-slate-400">Calculated by individual event timestamp / due date</p>
            </div>
          </div>
        </div>
      )}

      {/* DATE PICKER & PRESETS BAR */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 mb-6 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 text-xs scrollbar-none">
            {PRESETS.map((item) => {
              const isActive = !customActive && preset === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCustomActive(false);
                    setPreset(item.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/80'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Custom Date Range Picker */}
          <form onSubmit={handleApplyCustomRange} className="flex items-center gap-2 flex-wrap text-xs pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
            <span className="font-semibold text-slate-400 shrink-0">Custom Range:</span>
            <div className="flex items-center gap-1.5 flex-1 sm:flex-none">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-xs font-medium cursor-pointer"
                title="Start Date"
                required
              />
              <span className="text-slate-400">→</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className="py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-xs font-medium cursor-pointer"
                title="End Date (Optional)"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold transition-colors cursor-pointer shrink-0 shadow-xs"
            >
              Apply Range
            </button>
          </form>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Computing analytics for selected range...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Conversion Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Jobs Tracked
              </span>
              <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                {stats.totalJobs || 0}
              </p>
              <span className="text-[11px] text-slate-400 mt-1 block">In search pipeline</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Applications
              </span>
              <p className="text-3xl font-black text-cyan-500 mt-1">
                {stats.applied || 0}
              </p>
              <span className="text-[11px] text-slate-400 mt-1 block">Submitted applications</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Interviews & Calls
              </span>
              <p className="text-3xl font-black text-amber-500 mt-1">
                {stats.interviews || 0}
              </p>
              <span className="text-[11px] text-slate-400 mt-1 block">Active interview rounds</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Offers Received
              </span>
              <p className="text-3xl font-black text-emerald-500 mt-1">
                {stats.offers || 0}
              </p>
              <span className="text-[11px] text-slate-400 mt-1 block">Ultimate target</span>
            </div>
          </div>

          {/* Chart Row 1: Pipeline Funnel & Stage Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Funnel */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-brand-500" />
                    <span>Application Conversion Funnel</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Step-by-step pipeline drop-off</p>
                </div>
              </div>

              <div className="space-y-3">
                {funnel.map((item, idx) => {
                  const pct = Math.round((item.count / (stats.totalJobs || 1)) * 100);
                  return (
                    <div key={item.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {item.name}
                          </span>
                          {item.metric && (
                            <span className="text-[10px] text-slate-400 block">
                              {item.metric}
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                          {item.count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-600 to-indigo-500 transition-all duration-500"
                          style={{ width: `${Math.max(4, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stage Breakdown Horizontal Bars */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-500" />
                    <span>Jobs by Stage</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Current status across workflow stages</p>
                </div>
              </div>

              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {stageCounts.map((stg) => {
                  const barWidth = Math.round((stg.count / maxStageCount) * 100);
                  return (
                    <div key={stg.id} className="flex items-center gap-3 text-xs">
                      <span className="w-32 truncate text-slate-600 dark:text-slate-400 text-[11px]">
                        {stg.name}
                      </span>
                      <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            backgroundColor: stg.color || '#3b82f6',
                            width: `${Math.max(3, barWidth)}%`,
                          }}
                        />
                      </div>
                      <span className="w-8 text-right font-mono font-bold text-slate-900 dark:text-white text-[11px]">
                        {stg.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Chart Row 2: Match Distribution & Daily Discovery Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Match Score Distribution */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Flame className="w-4 h-4 text-rose-500" />
                    <span>Profile Match Distribution</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Alignment with Adarsh Vinothan's 3+ yr full-stack stack
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {matchDist.map((item) => (
                  <div
                    key={item.label}
                    className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40"
                  >
                    <span className="text-[11px] font-semibold text-slate-400 block truncate">
                      {item.label}
                    </span>
                    <p className="text-xl font-bold mt-1" style={{ color: item.color }}>
                      {item.count} jobs
                    </p>
                  </div>
                ))}
              </div>

              <div className="w-full flex h-3 rounded-full overflow-hidden">
                {matchDist.map((item) => (
                  <div
                    key={item.label}
                    style={{
                      backgroundColor: item.color,
                      width: `${(item.count / (stats.totalJobs || 1)) * 100}%`,
                    }}
                    title={`${item.label}: ${item.count}`}
                  />
                ))}
              </div>
            </div>

            {/* Daily Discovery Activity */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-brand-500" />
                    <span>Daily Jobs Discovered</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Automated job alert timeline in selected range</p>
                </div>
              </div>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {timeline.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No jobs added within this specific date range.</p>
                ) : (
                  timeline.map((item) => {
                    const barWidth = Math.round((item.count / maxTimelineCount) * 100);
                    return (
                      <div key={item.date} className="flex items-center gap-3 text-xs">
                        <span className="w-24 font-mono text-[11px] text-slate-500">
                          {item.date}
                        </span>
                        <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-4 rounded-lg overflow-hidden">
                          <div
                            className="h-full rounded-lg bg-brand-500 transition-all duration-300 flex items-center justify-end pr-2 text-[10px] text-white font-bold"
                            style={{ width: `${Math.max(10, barWidth)}%` }}
                          >
                            {item.count}
                          </div>
                        </div>
                        <span className="w-14 text-right text-[11px] font-medium text-slate-400">
                          {item.count} new
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Chart Row 3: Work Mode, Top Portals, and Locations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Work Mode */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-500" />
                <span>Work Modes</span>
              </h3>
              <p className="text-[11px] text-slate-400 mb-4">On-site vs Remote preference</p>

              <div className="space-y-3">
                {workModeList.map((wm) => (
                  <div key={wm.name} className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{wm.name}</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                      {wm.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Locations */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-500" />
                <span>Top Locations</span>
              </h3>
              <p className="text-[11px] text-slate-400 mb-4">UAE emirates & remote opportunities</p>

              <div className="space-y-3">
                {locationList.map((loc) => (
                  <div key={loc.name} className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                      {loc.name}
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                      {loc.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Job Sources */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                <Globe className="w-4 h-4 text-purple-500" />
                <span>Top Discovery Portals</span>
              </h3>
              <p className="text-[11px] text-slate-400 mb-4">Highest yielding platforms</p>

              <div className="space-y-3">
                {sourceList.slice(0, 5).map((src) => (
                  <div key={src.name} className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                      {src.name}
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                      {src.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
