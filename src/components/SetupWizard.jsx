'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  CheckCircle2,
  ArrowRight,
  UserCheck,
  FileSpreadsheet,
  CloudLightning,
  Sliders,
  LayoutDashboard,
  X
} from 'lucide-react';

export default function SetupWizard({ onDismiss }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('setup-wizard-dismissed');
    if (!dismissed) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const handleSkipOrComplete = () => {
    localStorage.setItem('setup-wizard-dismissed', 'true');
    setVisible(false);
    if (onDismiss) onDismiss();
  };

  const steps = [
    {
      step: 1,
      title: 'Review Your Profile',
      desc: 'Verify your Dubai-based developer profile, 3+ years experience, and resume links.',
      icon: UserCheck,
      actionText: 'Review Profile',
      actionHref: '/profile',
    },
    {
      step: 2,
      title: 'Import Excel Tracker',
      desc: 'Updated_Job_Tracker_2026-09-25.xlsx is pre-loaded with reference jobs. Import additional files any time.',
      icon: FileSpreadsheet,
      actionText: 'Open Import Tool',
      actionHref: '/import-export',
    },
    {
      step: 3,
      title: 'Connect Google Sheets',
      desc: 'Link your daily automated job-search sheet for 1-click or scheduled synchronization.',
      icon: CloudLightning,
      actionText: 'Configure Sync',
      actionHref: '/integrations/google-sheets',
    },
    {
      step: 4,
      title: 'Configure Stages',
      desc: 'Customize the 12 default Kanban stages (Applied, Interview, Offer, etc.) to your process.',
      icon: Sliders,
      actionText: 'Check Stages',
      actionHref: '/settings',
    },
    {
      step: 5,
      title: 'Open Command Dashboard',
      desc: 'Start tracking applications, moving Kanban cards, and reviewing follow-up alerts.',
      icon: LayoutDashboard,
      actionText: 'Enter Dashboard',
      actionHref: '/dashboard',
    },
  ];

  const current = steps[currentStep - 1];
  const Icon = current.icon;

  return (
    <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-brand-900/40 via-indigo-900/30 to-purple-900/40 border border-brand-500/30 shadow-lg relative overflow-hidden backdrop-blur-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-500 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-brand-300 uppercase tracking-wider">
            Quick Start Guide • Step {currentStep} of 5
          </span>
        </div>
        <button
          onClick={handleSkipOrComplete}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
        >
          <span>Dismiss Wizard</span>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-white/10 dark:bg-slate-800/80 border border-white/10 flex items-center justify-center text-brand-400 shrink-0">
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white">{current.title}</h4>
            <p className="text-xs text-slate-300 mt-0.5 max-w-xl">{current.desc}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={current.actionHref}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-white font-semibold text-xs shadow-md shadow-brand-500/20 transition-all"
          >
            <span>{current.actionText}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          {currentStep < 5 ? (
            <button
              onClick={() => setCurrentStep(prev => prev + 1)}
              className="px-3 py-2 rounded-xl border border-white/20 hover:bg-white/10 text-white text-xs font-medium transition-colors"
            >
              Next Step
            </button>
          ) : (
            <button
              onClick={handleSkipOrComplete}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
            >
              Complete!
            </button>
          )}
        </div>
      </div>

      {/* Progress Dots */}
      <div className="flex items-center gap-1.5 mt-4">
        {steps.map((s) => (
          <button
            key={s.step}
            onClick={() => setCurrentStep(s.step)}
            className={`h-1.5 rounded-full transition-all ${
              s.step === currentStep
                ? 'w-6 bg-brand-400'
                : s.step < currentStep
                ? 'w-2 bg-emerald-400'
                : 'w-2 bg-white/20'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
