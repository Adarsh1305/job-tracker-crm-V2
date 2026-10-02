'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Plus,
  Bell,
  Sun,
  Moon,
  Laptop,
  Menu,
  Sparkles,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import SyncStatusBadge from '@/components/SyncStatusBadge';

export default function Header({ onMobileMenuToggle, onOpenNewJob, onSyncComplete, followUpsCount = 0 }) {
  const router = useRouter();
  const { theme, setTheme, isDark } = useTheme();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Fetch notifications (follow-ups due and recent sync)
    async function loadNotifications() {
      try {
        const res = await fetch('/api/follow-ups');
        if (res.ok) {
          const data = await res.json();
          const items = [];
          if (data.overdue && data.overdue.length > 0) {
            items.push({
              id: 'overdue',
              type: 'urgent',
              title: `${data.overdue.length} Overdue Follow-up${data.overdue.length > 1 ? 's' : ''}`,
              desc: `Actions pending for ${data.overdue.map(j => j.company).slice(0, 2).join(', ')}`,
              time: 'Action required',
              link: '/follow-ups',
            });
          }
          if (data.today && data.today.length > 0) {
            items.push({
              id: 'today',
              type: 'warning',
              title: `${data.today.length} Follow-up${data.today.length > 1 ? 's' : ''} Due Today`,
              desc: `Review ${data.today.map(j => j.company).slice(0, 2).join(', ')}`,
              time: 'Today',
              link: '/follow-ups',
            });
          }
          items.push({
            id: 'sync-ready',
            type: 'info',
            title: 'Google Sheets Automation',
            desc: 'Daily job alert tracker synchronized and verified.',
            time: 'Live',
            link: '/integrations/google-sheets',
          });
          setNotifications(items);
        }
      } catch (e) {
        // silent
      }
    }
    loadNotifications();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/jobs?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6">
      {/* Mobile Toggle + Brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 md:hidden">
          <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm tracking-tight">JobHunt</span>
        </div>

        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="hidden sm:flex items-center relative w-64 md:w-80 lg:w-96">
          <Search className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search jobs, skills, company, location... (Enter)"
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              ×
            </button>
          )}
        </form>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Google Sheets Sync Quick Button */}
        <SyncStatusBadge onSyncComplete={onSyncComplete} />

        {/* Quick Add Job Button */}
        <button
          onClick={onOpenNewJob}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs shadow-xs hover:shadow-brand-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Add Job</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            {notifications.some(n => n.type === 'urgent' || n.type === 'warning') && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-3 z-50 animate-in fade-in zoom-in-95 duration-100"
              onClick={() => setShowNotifications(false)}
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Notifications & Reminders
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {notifications.length} alerts
                </span>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => router.push(n.link)}
                    className="p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors border border-transparent hover:border-slate-200/60 dark:hover:border-slate-700/60"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className={`text-xs font-semibold ${
                        n.type === 'urgent'
                          ? 'text-rose-500'
                          : n.type === 'warning'
                          ? 'text-amber-500'
                          : 'text-brand-500'
                      }`}>
                        {n.title}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                      {n.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
