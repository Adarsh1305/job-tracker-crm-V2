'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import MobileNav from '@/components/MobileNav';
import JobDetailDrawer from '@/components/JobDetailDrawer';
import NewJobModal from '@/components/NewJobModal';

export default function AppShell({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeJobId, setActiveJobId] = useState(null);
  const [newJobModalOpen, setNewJobModalOpen] = useState(false);
  const [stages, setStages] = useState([]);
  const [counts, setCounts] = useState({ totalJobs: 0, followUpsDue: 0 });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const loadGlobalStats = async () => {
    try {
      const [stagesRes, analyticsRes] = await Promise.all([
        fetch('/api/stages'),
        fetch('/api/analytics'),
      ]);
      if (stagesRes.ok) {
        const sData = await stagesRes.json();
        setStages(sData.stages || []);
      }
      if (analyticsRes.ok) {
        const aData = await analyticsRes.json();
        setCounts({
          totalJobs: aData.stats?.totalJobs || 0,
          followUpsDue: aData.stats?.followUpDue || 0,
        });
      }
    } catch (e) {
      console.error('Error loading global stats:', e);
    }
  };

  useEffect(() => {
    if (user) {
      loadGlobalStats();
    }
    const handleRefresh = () => loadGlobalStats();
    window.addEventListener('refresh-jobs', handleRefresh);
    return () => window.removeEventListener('refresh-jobs', handleRefresh);
  }, [user]);

  // Global listener for opening drawer
  useEffect(() => {
    const handleOpenJob = (e) => {
      if (e.detail?.jobId) {
        setActiveJobId(e.detail.jobId);
      }
    };
    window.addEventListener('open-job-detail', handleOpenJob);
    return () => window.removeEventListener('open-job-detail', handleOpenJob);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading JobHunt CRM...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Desktop Sidebar */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        counts={counts}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          collapsed ? 'md:pl-18' : 'md:pl-64'
        }`}
      >
        <Header
          onMobileMenuToggle={() => setMobileMenuOpen(true)}
          onOpenNewJob={() => setNewJobModalOpen(true)}
          onSyncComplete={() => {
            loadGlobalStats();
            window.dispatchEvent(new CustomEvent('refresh-jobs'));
          }}
          followUpsCount={counts.followUpsDue}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-12">
          {children}
        </main>
      </div>

      {/* Mobile Drawer & Bottom Navigation */}
      <MobileNav
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Global Job Detail Drawer */}
      <JobDetailDrawer
        jobId={activeJobId}
        stages={stages}
        onClose={() => setActiveJobId(null)}
        onJobUpdated={() => {
          loadGlobalStats();
          window.dispatchEvent(new CustomEvent('refresh-jobs'));
        }}
        onJobDeleted={() => {
          loadGlobalStats();
          window.dispatchEvent(new CustomEvent('refresh-jobs'));
        }}
      />

      {/* Global New Job Modal */}
      <NewJobModal
        isOpen={newJobModalOpen}
        stages={stages}
        onClose={() => setNewJobModalOpen(false)}
        onJobCreated={() => {
          loadGlobalStats();
          window.dispatchEvent(new CustomEvent('refresh-jobs'));
        }}
      />
    </div>
  );
}
