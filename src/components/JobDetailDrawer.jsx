'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  Calendar,
  Building,
  MapPin,
  Briefcase,
  DollarSign,
  Star,
  Clock,
  User,
  Mail,
  Phone,
  FileText,
  CheckCircle,
  AlertCircle,
  Send,
  Trash2,
  Save,
  Flame,
  ArrowRight,
  ShieldCheck,
  Link as LinkIcon
} from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import PriorityBadge from '@/components/PriorityBadge';
import MatchScoreBadge from '@/components/MatchScoreBadge';

export default function JobDetailDrawer({ jobId, onClose, onJobUpdated, onJobDeleted, stages = [] }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'application', 'timeline'
  const [job, setJob] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // Form states for editable fields
  const [stage, setStage] = useState('');
  const [priority, setPriority] = useState('medium');
  const [notes, setNotes] = useState('');
  const [appliedDate, setAppliedDate] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpType, setFollowUpType] = useState('email');
  const [followUpStatus, setFollowUpStatus] = useState('pending');
  const [interviewDate, setInterviewDate] = useState('');
  const [recruiterName, setRecruiterName] = useState('');
  const [recruiterEmail, setRecruiterEmail] = useState('');
  const [recruiterPhone, setRecruiterPhone] = useState('');
  const [personalRating, setPersonalRating] = useState(4);
  const [resumeStatus, setResumeStatus] = useState('');
  const [coverLetterStatus, setCoverLetterStatus] = useState('');

  useEffect(() => {
    if (!jobId) return;
    async function loadJobDetails() {
      setLoading(true);
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        if (res.ok) {
          const data = await res.json();
          setJob(data.job);
          setActivities(data.activityLogs || []);

          const app = data.job.application || {};
          setStage(app.stage || data.job.stage || 'new');
          setPriority(app.priority || 'medium');
          setNotes(app.notes || '');
          setAppliedDate(app.applied_date || '');
          setFollowUpDate(app.follow_up_date || '');
          setFollowUpType(app.follow_up_type || 'email');
          setFollowUpStatus(app.follow_up_status || 'pending');
          setInterviewDate(app.interview_date || '');
          setRecruiterName(app.recruiter_name || '');
          setRecruiterEmail(app.recruiter_email || '');
          setRecruiterPhone(app.recruiter_phone || '');
          setPersonalRating(app.personal_rating || 4);
          setResumeStatus(app.resume_status || '');
          setCoverLetterStatus(app.cover_letter_status || '');
        }
      } catch (err) {
        console.error('Error loading job details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadJobDetails();
  }, [jobId]);

  const handleStageChange = async (newStage) => {
    setStage(newStage);
    try {
      const res = await fetch(`/api/jobs/${jobId}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      });
      if (res.ok) {
        const updated = await res.json();
        setJob(prev => ({ ...prev, ...updated.job }));
        // Refresh timeline
        const actRes = await fetch(`/api/jobs/${jobId}/activity`);
        if (actRes.ok) {
          const actData = await actRes.json();
          setActivities(actData.activities || []);
        }
        if (onJobUpdated) onJobUpdated();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application: {
            stage,
            priority,
            notes,
            applied_date: appliedDate,
            follow_up_date: followUpDate,
            follow_up_type: followUpType,
            follow_up_status: followUpStatus,
            interview_date: interviewDate,
            recruiter_name: recruiterName,
            recruiter_email: recruiterEmail,
            recruiter_phone: recruiterPhone,
            personal_rating: personalRating,
            resume_status: resumeStatus,
            cover_letter_status: coverLetterStatus,
          },
        }),
      });

      if (res.ok) {
        if (onJobUpdated) onJobUpdated();
      }
    } catch (err) {
      console.error('Error saving application:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddActivityNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setAddingNote(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'note',
          title: 'User Note Added',
          description: newNote.trim(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setActivities(prev => [data.activity, ...prev]);
        setNewNote('');
        if (onJobUpdated) onJobUpdated();
      }
    } catch (err) {
      console.error('Error adding activity:', err);
    } finally {
      setAddingNote(false);
    }
  };

  const handleDeleteJob = async () => {
    if (!confirm(`Are you sure you want to remove ${job?.title} at ${job?.company} from your CRM?`)) return;
    try {
      const res = await fetch(`/api/jobs/${jobId}`, { method: 'DELETE' });
      if (res.ok) {
        if (onJobDeleted) onJobDeleted(jobId);
        onClose();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!jobId) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300 border-l border-slate-200 dark:border-slate-800">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm">Loading job details...</p>
            </div>
          </div>
        ) : job ? (
          <>
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-xs font-mono font-bold text-slate-500 bg-slate-200/60 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {job.id}
                    </span>
                    <MatchScoreBadge score={job.match_score} classification={job.match_classification} size="sm" />
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      via {job.source}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug truncate">
                    {job.title}
                  </h2>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                    <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      {job.company}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                      {job.work_mode}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={handleDeleteJob}
                    title="Delete Job"
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Quick Controls Bar: Stage & Priority */}
              <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Stage:
                  </span>
                  <select
                    value={stage}
                    onChange={(e) => handleStageChange(e.target.value)}
                    className="text-xs font-medium py-1.5 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-brand-500/30"
                  >
                    {stages.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Priority:
                  </span>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="text-xs font-medium py-1.5 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-brand-500/30"
                  >
                    <option value="high">🔥 High</option>
                    <option value="medium">⚡ Medium</option>
                    <option value="low">💤 Low</option>
                  </select>

                  <button
                    onClick={handleSaveChanges}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium transition-all shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{saving ? 'Saving...' : 'Save'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-5 bg-white dark:bg-slate-900 shrink-0">
              {[
                { id: 'overview', label: 'Job Overview' },
                { id: 'application', label: 'Application & Recruiter' },
                { id: 'timeline', label: `Timeline & Notes (${activities.length})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-5">
                  {/* Action Links */}
                  <div className="flex items-center gap-3">
                    {job.application_url && (
                      <a
                        href={job.application_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-xs transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Direct Apply Link</span>
                      </a>
                    )}
                    {job.job_url && job.job_url !== job.application_url && (
                      <a
                        href={job.job_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs transition-colors"
                      >
                        <LinkIcon className="w-3.5 h-3.5" />
                        <span>Job Description Page</span>
                      </a>
                    )}
                  </div>

                  {/* Highlights Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                      <span className="text-[11px] text-slate-400 font-medium block">Salary</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 block truncate">
                        {job.salary || 'Not specified'}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                      <span className="text-[11px] text-slate-400 font-medium block">Experience</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 block truncate">
                        {job.experience_required || 'Not specified'}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 col-span-2 sm:col-span-1">
                      <span className="text-[11px] text-slate-400 font-medium block">Posted Date</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 block truncate">
                        {job.posted_date || 'Recently'}
                      </span>
                    </div>
                  </div>

                  {/* Match Analysis Section */}
                  <div className="p-4 rounded-xl bg-brand-500/5 dark:bg-brand-500/10 border border-brand-500/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-brand-500" />
                        <span className="text-xs font-bold text-brand-700 dark:text-brand-300">
                          Why This Job Matches Adarsh Vinothan ({job.match_score}%)
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">{job.match_classification}</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      {job.match_reason || 'Strong technical match based on full-stack web development profile.'}
                    </p>

                    {job.matching_skills && (
                      <div>
                        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block mb-1.5">
                          ✓ Matching Skills in Profile:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {job.matching_skills.split(/[,;]/).map((skill, idx) => (
                            <span
                              key={idx}
                              className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-medium"
                            >
                              {skill.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {job.missing_requirements && (
                      <div>
                        <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 block mb-1.5">
                          ⚠️ Skill Gaps / Requirements to Address:
                        </span>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {job.missing_requirements}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Key Technologies */}
                  {job.key_skills && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Key Technologies & Skills
                      </span>
                      <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 font-mono text-[11px] leading-relaxed">
                        {job.key_skills}
                      </p>
                    </div>
                  )}

                  {/* Meta Information */}
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Date Added: {job.date_added || '2026-09-25'}</span>
                    <span>Alert Time: {job.alert_date} {job.alert_time}</span>
                  </div>
                </div>
              )}

              {/* TAB 2: APPLICATION & RECRUITER */}
              {activeTab === 'application' && (
                <div className="space-y-5">
                  {/* Dates & Follow-ups */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Application Date
                      </label>
                      <input
                        type="date"
                        value={appliedDate}
                        onChange={(e) => setAppliedDate(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500/30"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Interview Date
                      </label>
                      <input
                        type="datetime-local"
                        value={interviewDate}
                        onChange={(e) => setInterviewDate(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500/30"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Follow-up Due Date
                      </label>
                      <input
                        type="date"
                        value={followUpDate}
                        onChange={(e) => setFollowUpDate(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500/30"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Follow-up Type & Status
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={followUpType}
                          onChange={(e) => setFollowUpType(e.target.value)}
                          className="flex-1 text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        >
                          <option value="email">Email</option>
                          <option value="linkedin">LinkedIn Message</option>
                          <option value="call">Phone Call</option>
                          <option value="portal">Portal Check</option>
                        </select>
                        <select
                          value={followUpStatus}
                          onChange={(e) => setFollowUpStatus(e.target.value)}
                          className="flex-1 text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        >
                          <option value="pending">Pending</option>
                          <option value="completed">Completed ✓</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Recruiter & Contact Information */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Recruiter / Contact Person
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-400 font-medium">Name</label>
                        <input
                          type="text"
                          value={recruiterName}
                          onChange={(e) => setRecruiterName(e.target.value)}
                          placeholder="e.g. John Doe"
                          className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 font-medium">Email</label>
                        <input
                          type="email"
                          value={recruiterEmail}
                          onChange={(e) => setRecruiterEmail(e.target.value)}
                          placeholder="recruiter@company.com"
                          className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 font-medium">Phone</label>
                        <input
                          type="text"
                          value={recruiterPhone}
                          onChange={(e) => setRecruiterPhone(e.target.value)}
                          placeholder="+971 50..."
                          className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Resume & Documents */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Resume & Documents
                      </span>
                      {job.application?.resume_file_link && (
                        <a
                          href={job.application.resume_file_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-brand-500 hover:underline"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Open Google Drive Resume</span>
                        </a>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="text-[11px] text-slate-400">Resume Status</label>
                        <select
                          value={resumeStatus}
                          onChange={(e) => setResumeStatus(e.target.value)}
                          className="w-full text-xs p-2 mt-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                        >
                          <option value="Ready">Ready</option>
                          <option value="Tailored">Tailored</option>
                          <option value="Not Started">Not Started</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400">Cover Letter</label>
                        <select
                          value={coverLetterStatus}
                          onChange={(e) => setCoverLetterStatus(e.target.value)}
                          className="w-full text-xs p-2 mt-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                        >
                          <option value="Not required">Not required</option>
                          <option value="Ready">Ready</option>
                          <option value="Drafting">Drafting</option>
                        </select>
                      </div>
                    </div>

                    {job.application?.resume_quality_check && (
                      <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 shrink-0" />
                        <span>{job.application.resume_quality_check}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: TIMELINE & NOTES */}
              {activeTab === 'timeline' && (
                <div className="space-y-5">
                  {/* Notes Editor */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Personal Application Notes
                    </label>
                    <textarea
                      rows={4}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add private notes, application details, recruiter feedback, interview rounds..."
                      className="w-full text-xs p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500/30 font-sans"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={handleSaveChanges}
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Notes</span>
                      </button>
                    </div>
                  </div>

                  {/* Add Activity Entry Form */}
                  <form onSubmit={handleAddActivityNote} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Log Activity / Event to Timeline
                    </span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="e.g. Sent email follow-up to HR, or Recruiter replied on LinkedIn..."
                        className="flex-1 text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                      <button
                        type="submit"
                        disabled={addingNote || !newNote.trim()}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Post</span>
                      </button>
                    </div>
                  </form>

                  {/* Activity Timeline List */}
                  <div className="space-y-3 pt-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      Activity History
                    </span>
                    {activities.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No activity logged yet.</p>
                    ) : (
                      <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                        {activities.map((act) => (
                          <div key={act.id} className="relative group">
                            <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-brand-500 ring-4 ring-white dark:ring-slate-900" />
                            <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-xs">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                  {act.title}
                                </span>
                                <span className="text-[10px] text-slate-400 shrink-0">
                                  {new Date(act.timestamp).toLocaleDateString()} {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              {act.description && (
                                <p className="text-slate-600 dark:text-slate-400 mt-1 text-[11px] leading-relaxed">
                                  {act.description}
                                </p>
                              )}
                              <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                                By: {act.user}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
