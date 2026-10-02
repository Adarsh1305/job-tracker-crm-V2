'use client';

import React, { useState, useEffect } from 'react';
import {
  CloudLightning,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Clock,
  ShieldCheck,
  Save,
  Link as LinkIcon,
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';
import AppShell from '@/components/AppShell';

export default function GoogleSheetsPage() {
  const [config, setConfig] = useState({
    spreadsheetId: '',
    sheetName: 'Sheet1',
    range: 'Sheet1!A1:AI100',
    autoSync: true,
    syncIntervalHours: 6,
    csvUrl: '',
    apiKey: '',
    lastSyncTime: null,
    lastSyncStatus: null,
    lastSyncMessage: '',
  });

  const [syncLogs, setSyncLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cfgRes, logsRes] = await Promise.all([
        fetch('/api/integrations/google-sheets/config'),
        fetch('/api/sync-logs'),
      ]);
      if (cfgRes.ok) {
        const cData = await cfgRes.json();
        setConfig(cData.config || {});
      }
      if (logsRes.ok) {
        const lData = await logsRes.json();
        setSyncLogs(lData.logs || []);
      }
    } catch (e) {
      console.error('Error loading Google Sheets config:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/integrations/google-sheets/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
        alert('Google Sheets integration settings saved successfully.');
      }
    } catch (e) {
      console.error('Failed to save config:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/integrations/google-sheets/sync', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSyncResult(data);
        loadData();
        window.dispatchEvent(new CustomEvent('refresh-jobs'));
      } else {
        alert(data.error || 'Sync failed');
      }
    } catch (e) {
      alert('Network error while syncing');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <AppShell>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Google Sheets Daily Automation Sync</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
              Active Integration
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Connect your daily automated job-search sheet. Discovered jobs sync seamlessly without touching your manual application stages.
          </p>
        </div>

        <button
          onClick={handleSyncNow}
          disabled={syncing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-md shadow-brand-500/20 transition-all disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          <span>{syncing ? 'Synchronizing Google Sheet...' : 'Sync Now'}</span>
        </button>
      </div>

      {/* Sync Status Result Banner */}
      {syncResult && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-200 animate-in fade-in">
          <div className="flex items-center gap-2 mb-2 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Synchronization Completed Successfully</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2 rounded-lg bg-white/60 dark:bg-slate-900/60 border border-emerald-500/20">
              <span className="text-[10px] text-slate-400 block">New Jobs Added</span>
              <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                {syncResult.summary.newJobs}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-white/60 dark:bg-slate-900/60 border border-emerald-500/20">
              <span className="text-[10px] text-slate-400 block">External Details Refreshed</span>
              <span className="font-bold text-sm text-blue-600 dark:text-blue-400">
                {syncResult.summary.updatedJobs}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-white/60 dark:bg-slate-900/60 border border-emerald-500/20">
              <span className="text-[10px] text-slate-400 block">Duplicates Preserved</span>
              <span className="font-bold text-sm text-slate-600 dark:text-slate-300">
                {syncResult.summary.duplicatesSkipped}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-white/60 dark:bg-slate-900/60 border border-emerald-500/20">
              <span className="text-[10px] text-slate-400 block">Sync Errors</span>
              <span className="font-bold text-sm text-rose-500">
                {syncResult.summary.errors}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Two Column Layout: Configuration & Sync History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Config Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSaveConfig} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CloudLightning className="w-4 h-4 text-brand-500" />
                <span>Google Sheet Connection Settings</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Configure your daily automated job feed. Supports published CSV links or Google Cloud Sheets API v4.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              {/* Option A: Published CSV link */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Published Google Sheet CSV Feed URL (Recommended — Zero Credentials Required)
                </label>
                <div className="relative">
                  <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={config.csvUrl || ''}
                    onChange={(e) => setConfig({ ...config, csvUrl: e.target.value })}
                    placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500/30"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  In Google Sheets: File → Share → Publish to web → Link: Comma-separated values (.csv)
                </span>
              </div>

              {/* Option B: Direct Spreadsheet ID & API */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Spreadsheet ID
                  </label>
                  <input
                    type="text"
                    value={config.spreadsheetId || ''}
                    onChange={(e) => setConfig({ ...config, spreadsheetId: e.target.value })}
                    placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Worksheet / Tab Name
                  </label>
                  <input
                    type="text"
                    value={config.sheetName || 'Sheet1'}
                    onChange={(e) => setConfig({ ...config, sheetName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Auto-Sync Schedule */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Automated Scheduled Sync
                  </label>
                  <select
                    value={config.autoSync ? 'true' : 'false'}
                    onChange={(e) => setConfig({ ...config, autoSync: e.target.value === 'true' })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="true">Enabled (Background Sync Active)</option>
                    <option value="false">Manual Only (When 'Sync Now' is clicked)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Sync Frequency
                  </label>
                  <select
                    value={config.syncIntervalHours || 6}
                    onChange={(e) => setConfig({ ...config, syncIntervalHours: parseInt(e.target.value, 10) })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="1">Every Hour</option>
                    <option value="6">Every 6 Hours</option>
                    <option value="12">Every 12 Hours</option>
                    <option value="24">Daily (Every 24 Hours)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Credentials are encrypted and protected on the server.
              </span>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white font-semibold text-xs shadow-xs transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          </form>

          {/* Sync History Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Synchronization History</span>
            </h3>
            <p className="text-[11px] text-slate-400 mb-4">
              Audit log of all Google Sheet and Excel imports with duplicate resolution
            </p>

            {syncLogs.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6 text-center">No sync logs recorded yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {syncLogs.slice(0, 8).map((log) => (
                  <div key={log.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {log.sourceName}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          log.status === 'success'
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                        }`}>
                          {log.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        {log.message}
                      </p>
                    </div>

                    <div className="text-right shrink-0 text-[11px] text-slate-400">
                      <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                      <span className="block">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Architecture Principles & Guarantees */}
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-brand-500/5 dark:bg-brand-500/10 border border-brand-500/20 text-xs space-y-3">
            <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Strict Data Integrity Rule</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
              Our synchronization engine enforces a strict boundary between <strong>External Job Data</strong> (titles, company, salary, match scores) and <strong>Personal Application Data</strong> (stages, applied dates, recruiter contacts, personal notes).
            </p>
            <div className="p-3 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-brand-500/20 space-y-1 text-[11px]">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">Example:</span>
              <p className="text-slate-500 dark:text-slate-400">
                If the automated Google Sheet reports <code>JOB-2026-007: Stage: New</code>, but you have moved it to <code>Applied</code> on the website, subsequent Google Sheet syncs will <strong>NEVER</strong> overwrite your stage back to New.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs text-xs space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>Deduplication Algorithm</span>
            </h4>
            <ul className="space-y-2 text-[11px] text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-2">
                <span className="font-bold text-brand-500">1.</span>
                <span><strong>Job ID Match:</strong> Primary check looks up stable identifier (e.g. <code>JOB-2026-041</code>).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-brand-500">2.</span>
                <span><strong>Company & Title Match:</strong> Fallback check detects identical role postings across different portals.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-brand-500">3.</span>
                <span><strong>Zero Duplication:</strong> Updates external job descriptions without creating clone records.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
