'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  UserCheck,
  Building,
  Briefcase,
  MapPin,
  Mail,
  Phone,
  Globe,
  Github,
  Linkedin,
  FileText,
  Award,
  GraduationCap,
  Save,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Camera,
  Trash2,
  Upload,
  AlertTriangle
} from 'lucide-react';
import AppShell from '@/components/AppShell';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Profile photo upload states
  const fileInputRef = useRef(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [photoSuccess, setPhotoSuccess] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          setProfile(data.profile);
        }
      } catch (e) {
        console.error('Error loading profile:', e);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
        window.dispatchEvent(new CustomEvent('profile-updated'));
      }
    } catch (e) {
      console.error('Error saving profile:', e);
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoError('');
    setPhotoSuccess('');

    // Format validation
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setPhotoError('Invalid format. Only JPG, PNG, and WebP images are allowed.');
      return;
    }

    // Size validation (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('File size exceeds 5MB limit. Please upload an image under 5MB.');
      return;
    }

    setPhotoUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);

      const res = await fetch('/api/profile/photo', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setProfile((prev) => ({
          ...prev,
          profile_photo_url: data.profile_photo_url,
          profile_photo_data_url: data.profile?.profile_photo_data_url || prev.profile_photo_data_url,
        }));
        setPhotoSuccess('Profile photo updated and saved successfully.');
        setTimeout(() => setPhotoSuccess(''), 4000);
        window.dispatchEvent(new CustomEvent('profile-updated'));
      } else {
        setPhotoError(data.error || 'Failed to upload photo.');
      }
    } catch (err) {
      console.error('Error uploading photo:', err);
      setPhotoError('Network error uploading profile photo.');
    } finally {
      setPhotoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePhotoRemove = async () => {
    if (!confirm('Are you sure you want to remove your profile photo?')) return;
    setPhotoUploading(true);
    setPhotoError('');
    try {
      const res = await fetch('/api/profile/photo', { method: 'DELETE' });
      if (res.ok) {
        setProfile((prev) => ({
          ...prev,
          profile_photo_url: '',
          profile_photo_data_url: '',
        }));
        setPhotoSuccess('Profile photo removed.');
        setTimeout(() => setPhotoSuccess(''), 4000);
        window.dispatchEvent(new CustomEvent('profile-updated'));
      }
    } catch (err) {
      console.error(err);
      setPhotoError('Failed to remove photo.');
    } finally {
      setPhotoUploading(false);
    }
  };

  if (loading || !profile) {
    return (
      <AppShell>
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Loading professional profile...</p>
        </div>
      </AppShell>
    );
  }

  const avatarUrl = profile.profile_photo_url || profile.profile_photo_data_url;

  return (
    <AppShell>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Professional Profile & Resume Reference</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
              Verified Candidate
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Authoritative candidate profile powering match score calculations and job discovery
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-md shadow-brand-500/20 transition-all cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving Profile...' : savedSuccess ? 'Saved ✓' : 'Save Changes'}</span>
        </button>
      </div>

      {/* Notifications */}
      {photoError && (
        <div className="mb-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{photoError}</span>
        </div>
      )}
      {photoSuccess && (
        <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{photoSuccess}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Top Hero Card with Circular Profile Photo */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            {/* Circular Avatar + Upload / Remove Actions */}
            <div className="relative group shrink-0 self-start sm:self-center">
              <div className="w-20 h-20 rounded-full overflow-hidden ring-3 ring-brand-500/30 dark:ring-brand-500/40 shadow-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center text-2xl font-black">
                    AV
                  </div>
                )}
              </div>

              {photoUploading && (
                <div className="absolute inset-0 rounded-full bg-slate-950/60 backdrop-blur-2xs flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            {/* Avatar Control Buttons & Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{profile.name}</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold border border-blue-500/20">
                  {profile.visaStatus || 'Visit Visa'}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                  {profile.yearsOfExperience || '3+ years'}
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {profile.title}
              </p>

              <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  {profile.location}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400" />
                  {profile.email}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {profile.phone}
                </span>
              </div>

              {/* Upload / Replace / Remove Photo Button Row */}
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <button
                  type="button"
                  disabled={photoUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-brand-500" />
                  <span>{avatarUrl ? 'Replace Photo' : 'Upload Photo'}</span>
                </button>

                {avatarUrl && (
                  <button
                    type="button"
                    disabled={photoUploading}
                    onClick={handlePhotoRemove}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-xs font-medium transition-colors cursor-pointer"
                    title="Remove profile photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                )}

                <span className="text-[10px] text-slate-400">
                  (JPG, PNG, WebP up to 5MB)
                </span>
              </div>
            </div>
          </div>

          {/* Quick Drive Links */}
          {profile.resumeLink && (
            <div className="shrink-0 flex items-center gap-2">
              <a
                href={profile.resumeLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
              >
                <FileText className="w-4 h-4 text-brand-500" />
                <span>Open Master Resume (PDF)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>

        {/* Two Columns: Contact & Preferences */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Target Job Preferences */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-brand-500" />
              <span>Job Search Preferences</span>
            </h3>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Roles
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {profile.targetRoles?.map((r, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-brand-500/10 text-brand-700 dark:text-brand-300 font-semibold border border-brand-500/20 text-[11px]">
                    {r}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Locations
                </label>
                <input
                  type="text"
                  value={profile.targetLocations?.join(', ') || ''}
                  onChange={(e) => setProfile({ ...profile, targetLocations: e.target.value.split(',').map(s => s.trim()) })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Minimum Salary (AED / mo)
                </label>
                <input
                  type="number"
                  value={profile.minSalaryAED || 8000}
                  onChange={(e) => setProfile({ ...profile, minSalaryAED: parseInt(e.target.value, 10) })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Professional Bio Summary
              </label>
              <textarea
                rows={3}
                value={profile.bio || ''}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Social Links & Web Presence */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-500" />
              <span>Contact & Online Profiles</span>
            </h3>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Portfolio Website
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={profile.portfolio || ''}
                  onChange={(e) => setProfile({ ...profile, portfolio: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                LinkedIn Profile
              </label>
              <div className="relative">
                <Linkedin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={profile.linkedin || ''}
                  onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                GitHub Repository
              </label>
              <div className="relative">
                <Github className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={profile.github || ''}
                  onChange={(e) => setProfile({ ...profile, github: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Resume Google Drive Link
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={profile.resumeLink || ''}
                  onChange={(e) => setProfile({ ...profile, resumeLink: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Skills Grid */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Core Technical Competencies ({profile.skills?.length || 0})</span>
          </h3>
          <p className="text-xs text-slate-400 mb-3">
            Matching engine compares these skills against incoming job postings to compute match scores
          </p>

          <div className="flex flex-wrap gap-2">
            {profile.skills?.map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700/80"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Work Experience & Education */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Experience */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building className="w-4 h-4 text-brand-500" />
              <span>Work Experience</span>
            </h3>

            <div className="space-y-4">
              {profile.workExperience?.map((exp, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">{exp.role}</h4>
                      <p className="text-[11px] text-brand-600 dark:text-brand-400 font-semibold">{exp.company} • {exp.location}</p>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400 shrink-0">{exp.period}</span>
                  </div>
                  <ul className="mt-2 space-y-1 list-disc list-inside text-slate-600 dark:text-slate-400 text-[11px]">
                    {exp.highlights?.map((h, hi) => (
                      <li key={hi} className="leading-relaxed">{h}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Education */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-emerald-500" />
              <span>Education & Qualifications</span>
            </h3>

            <div className="space-y-3">
              {profile.education?.map((edu, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">{edu.degree}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{edu.institution}</p>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400 shrink-0">{edu.period}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </form>
    </AppShell>
  );
}
