'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Sliders,
  Sun,
  Moon,
  Laptop,
  Layers,
  RotateCcw,
  Save,
  CheckCircle2,
  Trash2,
  Plus,
  ShieldAlert,
  GripVertical,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  Info,
  X,
  Sparkles
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { useTheme } from '@/context/ThemeContext';

export default function SettingsPage() {
  const { theme, setTheme, isDark } = useTheme();
  const [stages, setStages] = useState([]);
  const [stageCounts, setStageCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingStages, setSavingStages] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Add stage modal state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newStageName, setNewStageName] = useState('');
  const [newStageDesc, setNewStageDesc] = useState('');
  const [newStageColor, setNewStageColor] = useState('#6366f1');
  const [isCreatingStage, setIsCreatingStage] = useState(false);

  // Delete / Migrate modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [stageToDelete, setStageToDelete] = useState(null);
  const [migrateTargetId, setMigrateTargetId] = useState('');
  const [isDeletingStage, setIsDeletingStage] = useState(false);

  // Drag and drop reordering
  const [draggedIndex, setDraggedIndex] = useState(null);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stages');
      if (res.ok) {
        const data = await res.json();
        setStages(data.stages || []);
        setStageCounts(data.counts || {});
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveStages = async (stagesToSave = stages) => {
    setSavingStages(true);
    setMessage('');
    setErrorMsg('');
    try {
      const res = await fetch('/api/stages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stages: stagesToSave }),
      });
      if (res.ok) {
        const data = await res.json();
        setStages(data.stages || stagesToSave);
        setMessage('Workflow stages saved successfully.');
        setTimeout(() => setMessage(''), 3000);
        window.dispatchEvent(new CustomEvent('refresh-jobs'));
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Failed to save stages.');
      }
    } catch (e) {
      setErrorMsg('Error saving stages.');
    } finally {
      setSavingStages(false);
    }
  };

  const handleCreateStage = async (e) => {
    e.preventDefault();
    if (!newStageName.trim()) return;
    setIsCreatingStage(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/stages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newStageName.trim(),
          description: newStageDesc.trim(),
          color: newStageColor,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage(`Stage "${data.stage.name}" created successfully.`);
        setTimeout(() => setMessage(''), 3000);
        setNewStageName('');
        setNewStageDesc('');
        setNewStageColor('#6366f1');
        setAddModalOpen(false);
        loadSettings();
        window.dispatchEvent(new CustomEvent('refresh-jobs'));
      } else {
        setErrorMsg(data.error || 'Failed to create stage.');
      }
    } catch (e) {
      setErrorMsg('Network error creating stage.');
    } finally {
      setIsCreatingStage(false);
    }
  };

  const handleOpenDelete = (stg) => {
    setStageToDelete(stg);
    const count = stageCounts[stg.id] || 0;
    // Set a default migration target (first other stage)
    const otherStages = stages.filter(s => s.id !== stg.id);
    setMigrateTargetId(otherStages[0]?.id || 'new');
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!stageToDelete) return;
    setIsDeletingStage(true);
    setErrorMsg('');
    try {
      const count = stageCounts[stageToDelete.id] || 0;
      let url = `/api/stages?id=${encodeURIComponent(stageToDelete.id)}`;
      if (count > 0) {
        url += `&migrateTo=${encodeURIComponent(migrateTargetId)}`;
      }

      const res = await fetch(url, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage(
          data.migratedCount > 0
            ? `Stage removed and ${data.migratedCount} job(s) migrated successfully.`
            : `Stage removed successfully.`
        );
        setTimeout(() => setMessage(''), 3500);
        setDeleteModalOpen(false);
        setStageToDelete(null);
        loadSettings();
        window.dispatchEvent(new CustomEvent('refresh-jobs'));
      } else {
        setErrorMsg(data.error || 'Failed to delete stage.');
      }
    } catch (e) {
      setErrorMsg('Error deleting stage.');
    } finally {
      setIsDeletingStage(false);
    }
  };

  const handleStageFieldChange = (index, field, value) => {
    const next = [...stages];
    next[index] = { ...next[index], [field]: value };
    setStages(next);
  };

  // Reorder buttons (Move Up / Move Down)
  const handleMoveStage = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= stages.length) return;
    const reordered = [...stages];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    setStages(reordered);
    handleSaveStages(reordered);
  };

  // Drag and Drop handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const reordered = [...stages];
    const [draggedItem] = reordered.splice(draggedIndex, 1);
    reordered.splice(index, 0, draggedItem);
    setDraggedIndex(index);
    setStages(reordered);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    handleSaveStages(stages);
  };

  const handleResetDatabase = async () => {
    if (!confirm('Are you sure you want to reset the CRM database and reload the reference jobs from Updated_Job_Tracker_2026-09-25.xlsx?')) {
      return;
    }
    setResetting(true);
    try {
      const res = await fetch('/api/admin/reseed', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        alert(data.message || 'Database reseeded successfully.');
        window.location.reload();
      }
    } catch (e) {
      alert('Failed to reset database');
    } finally {
      setResetting(false);
    }
  };

  return (
    <AppShell>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>CRM & System Settings</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Customize workflow stages, stage ordering, theme appearance, and database maintenance
          </p>
        </div>

        {message && (
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 animate-in fade-in">
            {message}
          </span>
        )}
        {errorMsg && (
          <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 animate-in fade-in">
            {errorMsg}
          </span>
        )}
      </div>

      <div className="space-y-6">
        {/* Appearance Settings */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
            <Sun className="w-4 h-4 text-amber-500" />
            <span>Theme & Display Appearance</span>
          </h3>
          <p className="text-xs text-slate-400 mb-4">Select your preferred user interface appearance</p>

          <div className="grid grid-cols-3 gap-3 max-w-md text-xs font-semibold">
            <button
              onClick={() => setTheme('light')}
              className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                theme === 'light'
                  ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400 ring-2 ring-brand-500/20'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Sun className="w-5 h-5 text-amber-500" />
              <span>Light Mode</span>
            </button>

            <button
              onClick={() => setTheme('dark')}
              className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400 ring-2 ring-brand-500/20'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Moon className="w-5 h-5 text-indigo-400" />
              <span>Dark Mode</span>
            </button>

            <button
              onClick={() => setTheme('system')}
              className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                theme === 'system'
                  ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400 ring-2 ring-brand-500/20'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Laptop className="w-5 h-5 text-slate-400" />
              <span>System</span>
            </button>
          </div>
        </div>

        {/* APPLICATION STAGES CUSTOMIZER (Requirements 7 & 8) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-500" />
                <span>Application Stages Customizer ({stages.length} Stages)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Drag to reorder, edit names & descriptions, or add custom stages. Changes update Kanban, dropdowns, and filters in real-time.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setAddModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400 text-xs font-semibold hover:bg-brand-100 dark:hover:bg-brand-900/60 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Custom Stage</span>
              </button>

              <button
                onClick={() => handleSaveStages()}
                disabled={savingStages}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingStages ? 'Saving...' : 'Save All Stages'}</span>
              </button>
            </div>
          </div>

          {/* Reorderable Stage List */}
          <div className="space-y-2.5">
            {stages.map((stg, index) => {
              const jobsInStage = stageCounts[stg.id] || 0;
              const isDefault = stg.is_default !== false;

              return (
                <div
                  key={stg.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs ${
                    draggedIndex === index
                      ? 'border-brand-500 bg-brand-500/10 shadow-md ring-2 ring-brand-500/20'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {/* Left: Drag Handle, Order #, Color Picker, and Name */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Drag Handle */}
                    <div
                      className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      title="Drag to reorder stage position"
                    >
                      <GripVertical className="w-4 h-4" />
                    </div>

                    {/* Step Position Indicator */}
                    <span className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300 font-mono font-bold text-[11px] flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>

                    {/* Color Input */}
                    <input
                      type="color"
                      value={stg.color || '#3b82f6'}
                      onChange={(e) => handleStageFieldChange(index, 'color', e.target.value)}
                      className="w-7 h-7 rounded-lg border-0 cursor-pointer p-0 bg-transparent shrink-0"
                      title="Change stage color"
                    />

                    {/* Stage Name & ID */}
                    <div className="flex-1 min-w-[140px] max-w-xs">
                      <input
                        type="text"
                        value={stg.name}
                        onChange={(e) => handleStageFieldChange(index, 'name', e.target.value)}
                        className="w-full text-xs font-bold py-1 px-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                        placeholder="Stage Name"
                      />
                      <span className="text-[10px] font-mono text-slate-400 px-1 mt-0.5 block truncate">
                        ID: {stg.id}
                      </span>
                    </div>

                    {/* Description */}
                    <div className="hidden sm:block flex-1 min-w-[160px]">
                      <input
                        type="text"
                        value={stg.description || ''}
                        onChange={(e) => handleStageFieldChange(index, 'description', e.target.value)}
                        className="w-full text-[11px] py-1 px-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                        placeholder="Optional description / instructions..."
                      />
                    </div>
                  </div>

                  {/* Right: Badges, Up/Down controls, and Actions */}
                  <div className="flex items-center gap-2 justify-end self-end md:self-center shrink-0">
                    {/* System vs Custom Stage Badge */}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isDefault
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {isDefault ? 'System Stage' : 'Custom Stage'}
                    </span>

                    {/* Job Count */}
                    <span className="px-2 py-0.5 rounded-lg bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-semibold" title="Number of jobs currently in this stage">
                      {jobsInStage} job{jobsInStage !== 1 ? 's' : ''}
                    </span>

                    {/* Move Up / Move Down Buttons (Touch/Mobile Friendly Reordering) */}
                    <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMoveStage(index, -1)}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent"
                        title="Move Up"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === stages.length - 1}
                        onClick={() => handleMoveStage(index, 1)}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent border-l border-slate-200 dark:border-slate-700"
                        title="Move Down"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Delete Custom Stage Button */}
                    {!isDefault && (
                      <button
                        type="button"
                        onClick={() => handleOpenDelete(stg)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Remove custom stage"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Database Maintenance & Re-seeding */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-500/20 p-5 shadow-xs">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                <span>Database Reset & Reference Tracker Re-seed</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
                Reset all records and re-seed the CRM database with the initial reference job opportunities from <code className="text-slate-700 dark:text-slate-300 font-mono">Updated_Job_Tracker_2026-09-25.xlsx</code>.
              </p>
            </div>

            <button
              onClick={handleResetDatabase}
              disabled={resetting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
              <span>{resetting ? 'Resetting...' : 'Reseed Database'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: CREATE CUSTOM STAGE */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-600 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Create Custom Stage</h3>
                  <p className="text-[11px] text-slate-400">Add a custom step to your application pipeline</p>
                </div>
              </div>
              <button
                onClick={() => setAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStage} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Stage Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Assessment, Client Interview, Take-Home Task..."
                  value={newStageName}
                  onChange={(e) => setNewStageName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Technical coding assignment or take-home project"
                  value={newStageDesc}
                  onChange={(e) => setNewStageDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Badge Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={newStageColor}
                    onChange={(e) => setNewStageColor(e.target.value)}
                    className="w-10 h-10 rounded-xl border-0 cursor-pointer p-0 bg-transparent shrink-0"
                  />
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {['#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewStageColor(c)}
                        className={`w-6 h-6 rounded-full border-2 transition-transform ${
                          newStageColor === c ? 'scale-115 border-white ring-2 ring-brand-500' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingStage || !newStageName.trim()}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isCreatingStage ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Stage</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SAFE REMOVE & MIGRATION CHECK (Requirement 7) */}
      {deleteModalOpen && stageToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Remove Custom Stage: "{stageToDelete.name}"?
              </h3>
              {(stageCounts[stageToDelete.id] || 0) > 0 ? (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold leading-relaxed">
                  ⚠️ This stage is currently used by {stageCounts[stageToDelete.id]} job(s). Choose another stage for these jobs before removing it to prevent orphaned records.
                </p>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No jobs are currently in this stage. It can be safely removed from your workflow.
                </p>
              )}
            </div>

            {(stageCounts[stageToDelete.id] || 0) > 0 && (
              <div className="space-y-1 text-xs">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">
                  Move jobs to:
                </label>
                <select
                  value={migrateTargetId}
                  onChange={(e) => setMigrateTargetId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold cursor-pointer"
                >
                  {stages
                    .filter((s) => s.id !== stageToDelete.id)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.id})
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isDeletingStage}
                onClick={() => {
                  setDeleteModalOpen(false);
                  setStageToDelete(null);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingStage}
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {isDeletingStage ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (stageCounts[stageToDelete.id] || 0) > 0 ? (
                  <span>Move & Remove</span>
                ) : (
                  <span>Delete Stage</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
