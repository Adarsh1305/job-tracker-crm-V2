'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  FileCheck,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Filter,
  Columns,
  Sparkles,
  ArrowRight,
  Database,
  RotateCcw,
  Check,
  ExternalLink,
  Layers
} from 'lucide-react';
import AppShell from '@/components/AppShell';

export default function ImportExportPage() {
  const [activeTab, setActiveTab] = useState('import'); // 'import' | 'export'
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [showFailedRows, setShowFailedRows] = useState(false);
  const fileInputRef = useRef(null);

  // Export filters
  const [exportStage, setExportStage] = useState('all');
  const [exportPriority, setExportPriority] = useState('all');
  const [exportMinScore, setExportMinScore] = useState('');
  const [exporting, setExporting] = useState(false);

  const resetImport = () => {
    setFile(null);
    setPreviewData(null);
    setImportResult(null);
    setShowFailedRows(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelected = async (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setPreviewData(null);
    setImportResult(null);
    setShowFailedRows(false);
    setLoadingPreview(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('action', 'preview');

      const res = await fetch('/api/import/excel', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setPreviewData(data);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to parse Excel file');
      }
    } catch (e) {
      alert('Error parsing Excel file: ' + e.message);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!file || !previewData) return;
    setImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('action', 'import');
      formData.append('mapping', JSON.stringify(previewData.mapping));

      const res = await fetch('/api/import/excel', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setImportResult(data.summary);
        window.dispatchEvent(new CustomEvent('refresh-jobs'));
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to complete import');
      }
    } catch (e) {
      alert('Import failed: ' + e.message);
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadExport = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/export/excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: exportStage,
          priority: exportPriority,
          minScore: exportMinScore,
        }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `JobHunt_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
        a.click();
      } else {
        alert('Export failed');
      }
    } catch (e) {
      alert('Export failed: ' + e.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <AppShell>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Import & Export Center</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold border border-brand-500/20">
              Excel (.xlsx)
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Seamlessly import Excel trackers, inspect row breakdown, preserve personal application history, and export custom reports
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs">
          <button
            onClick={() => setActiveTab('import')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'import'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Import Excel
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'export'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Export Excel
          </button>
        </div>
      </div>

      {activeTab === 'import' ? (
        <div className="space-y-6">
          {/* Upload Drop Zone */}
          {!importResult && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileSelected(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-500 rounded-2xl p-8 text-center cursor-pointer bg-white/50 dark:bg-slate-900/50 transition-all hover:bg-brand-500/5 group"
            >
              <input
                type="file"
                ref={fileInputRef}
                accept=".xlsx,.xls"
                onChange={(e) => e.target.files && handleFileSelected(e.target.files[0])}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {file ? file.name : 'Drag & drop your Excel tracker (.xlsx) here'}
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Upload any daily tracker (e.g. <code className="text-brand-500">Updated_Job_Tracker_2026-09-25.xlsx</code>). All rows are automatically detected, validated, and merged without losing personal stages or notes.
              </p>
            </div>
          )}

          {/* Loading Indicator */}
          {loadingPreview && (
            <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400">Scanning worksheet rows and checking for duplicates...</p>
            </div>
          )}

          {/* Comprehensive Import Summary Card (Section 16) */}
          {importResult && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      Import Finished Successfully
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Processed file: <span className="font-semibold text-slate-700 dark:text-slate-300">{file?.name}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={resetImport}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Import Another File</span>
                  </button>
                  <Link
                    href="/jobs"
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    <span>View in Jobs ({importResult.databaseRecordsAfterImport})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* 7 Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
                {/* 1. Total Excel Rows */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block truncate">Total Excel Rows</span>
                  <span className="font-black text-xl text-slate-900 dark:text-white mt-1 block">
                    {importResult.totalExcelRows}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Rows detected</span>
                </div>

                {/* 2. Valid Records */}
                <div className="p-3 rounded-xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20">
                  <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 block truncate">Valid Records</span>
                  <span className="font-black text-xl text-blue-600 dark:text-blue-400 mt-1 block">
                    {importResult.validRecords}
                  </span>
                  <span className="text-[10px] text-blue-500/70 block mt-0.5">Ready to process</span>
                </div>

                {/* 3. New Jobs */}
                <div className="p-3 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 block truncate">New Jobs Added</span>
                  <span className="font-black text-xl text-emerald-600 dark:text-emerald-400 mt-1 block">
                    {importResult.newJobs}
                  </span>
                  <span className="text-[10px] text-emerald-500/70 block mt-0.5">Inserted to DB</span>
                </div>

                {/* 4. Updated Jobs */}
                <div className="p-3 rounded-xl bg-purple-500/5 dark:bg-purple-500/10 border border-purple-500/20">
                  <span className="text-[11px] font-medium text-purple-600 dark:text-purple-400 block truncate">Existing Updated</span>
                  <span className="font-black text-xl text-purple-600 dark:text-purple-400 mt-1 block">
                    {importResult.updatedJobs}
                  </span>
                  <span className="text-[10px] text-purple-500/70 block mt-0.5">Details refreshed</span>
                </div>

                {/* 5. Duplicates Skipped */}
                <div className="p-3 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20">
                  <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 block truncate">Duplicates Skipped</span>
                  <span className="font-black text-xl text-amber-600 dark:text-amber-400 mt-1 block">
                    {importResult.duplicatesSkipped}
                  </span>
                  <span className="text-[10px] text-amber-500/70 block mt-0.5">Identical in DB</span>
                </div>

                {/* 6. Invalid / Failed */}
                <div className={`p-3 rounded-xl border ${
                  (importResult.failedRecords || importResult.invalidRecords || 0) > 0
                    ? 'bg-rose-500/10 border-rose-500/30'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                }`}>
                  <span className={`text-[11px] font-medium block truncate ${
                    (importResult.failedRecords || importResult.invalidRecords || 0) > 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}>Invalid / Failed</span>
                  <span className={`font-black text-xl mt-1 block ${
                    (importResult.failedRecords || importResult.invalidRecords || 0) > 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}>
                    {importResult.failedRecords || importResult.invalidRecords || 0}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Missing required info</span>
                </div>

                {/* 7. Total Database Records */}
                <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/30">
                  <span className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 block truncate">Database Total</span>
                  <span className="font-black text-xl text-brand-600 dark:text-brand-400 mt-1 block">
                    {importResult.databaseRecordsAfterImport}
                  </span>
                  <span className="text-[10px] text-brand-500/80 block mt-0.5">Active positions</span>
                </div>
              </div>

              {/* Informative Note: Personal Application Data Intact */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-500 shrink-0" />
                  <span>
                    <strong>Personal Data Protection Active:</strong> Application stages, follow-up dates, recruiters, and personal notes are always preserved during imports and syncs.
                  </span>
                </div>
                {importResult.emptyRowsSkipped > 0 && (
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {importResult.emptyRowsSkipped} completely blank row(s) safely ignored
                  </span>
                )}
              </div>

              {/* Expandable Failed Rows List */}
              {importResult.failedRowsList && importResult.failedRowsList.length > 0 && (
                <div className="border border-rose-500/20 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setShowFailedRows(!showFailedRows)}
                    className="w-full p-3 bg-rose-500/5 hover:bg-rose-500/10 flex items-center justify-between text-xs font-semibold text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span>View Failed Rows ({importResult.failedRowsList.length})</span>
                    </span>
                    {showFailedRows ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showFailedRows && (
                    <div className="p-3 bg-white dark:bg-slate-900 border-t border-rose-500/20 text-xs">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-400">
                            <th className="py-2 px-3">Excel Row #</th>
                            <th className="py-2 px-3">Reason for Failure</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {importResult.failedRowsList.map((fail, i) => (
                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <td className="py-2 px-3 font-mono font-semibold text-rose-500">
                                Row {fail.rowNumber}
                              </td>
                              <td className="py-2 px-3 text-slate-600 dark:text-slate-300">
                                {fail.reason}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Preview & Mapping Table */}
          {previewData && !importResult && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-brand-500" />
                    <span>Worksheet Analysis: {previewData.totalRows} Total Rows Detected</span>
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span><strong>{previewData.summary.potentialNew}</strong> New Jobs</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span><strong>{previewData.summary.potentialDuplicates}</strong> Existing Records</span>
                    </span>
                    {previewData.emptyRowsSkipped > 0 && (
                      <span className="text-slate-400">({previewData.emptyRowsSkipped} empty rows skipped)</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={resetImport}
                    className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExecuteImport}
                    disabled={importing}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>{importing ? 'Importing & Merging...' : `Confirm & Import ${previewData.summary.validRows} Records`}</span>
                  </button>
                </div>
              </div>

              {/* Sample Rows Preview */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>First 10 Rows Sample Preview</span>
                  <span className="text-[11px] font-normal text-slate-400">Sheet: {previewData.selectedSheet}</span>
                </div>

                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-400">
                        <th className="py-2.5 px-3">Excel Row</th>
                        <th className="py-2.5 px-3">Job ID</th>
                        <th className="py-2.5 px-3">Title</th>
                        <th className="py-2.5 px-3">Company</th>
                        <th className="py-2.5 px-3">Match</th>
                        <th className="py-2.5 px-3">Duplicate Check Rule</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {previewData.previewRows.map((r) => (
                        <tr key={r._rowNumber} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400">Row {r._rowNumber}</td>
                          <td className="py-2.5 px-3 font-mono font-semibold text-[11px]">{r['Job ID'] || 'Auto'}</td>
                          <td className="py-2.5 px-3 font-bold truncate max-w-xs">{r['Job Title']}</td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 truncate max-w-[150px]">{r['Company']}</td>
                          <td className="py-2.5 px-3 font-semibold text-brand-500">{r['Match Score']}%</td>
                          <td className="py-2.5 px-3">
                            {r._isDuplicate ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/20">
                                Existing ({r._duplicateType})
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                                New Job
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* EXPORT TAB */
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-500" />
                <span>Export Job Tracker to Excel (.xlsx)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Download a formatted Excel spreadsheet containing all active jobs, application stages, recruiter details, and notes.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Filter by Stage
                </label>
                <select
                  value={exportStage}
                  onChange={(e) => setExportStage(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="all">All Stages (Full Database)</option>
                  <option value="new">New Only</option>
                  <option value="applied">Applied Only</option>
                  <option value="interview">Interview Rounds</option>
                  <option value="offer">Offers</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Filter by Priority
                </label>
                <select
                  value={exportPriority}
                  onChange={(e) => setExportPriority(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High Priority Only</option>
                  <option value="medium">Medium & High</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Minimum Match Score
                </label>
                <select
                  value={exportMinScore}
                  onChange={(e) => setExportMinScore(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="">Any Score</option>
                  <option value="85">≥ 85% (Strong Matches Only)</option>
                  <option value="70">≥ 70% (Good Matches & Above)</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Exports formatted columns matching your original tracker structure.
              </span>
              <button
                onClick={handleDownloadExport}
                disabled={exporting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{exporting ? 'Generating XLSX...' : 'Download .XLSX Export'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
