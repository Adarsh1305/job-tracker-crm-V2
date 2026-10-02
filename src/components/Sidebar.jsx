'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Briefcase,
  KanbanSquare,
  Clock,
  BarChart3,
  FileSpreadsheet,
  CloudLightning,
  UserCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Sidebar({ collapsed, setCollapsed, counts = {} }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [photoUrl, setPhotoUrl] = useState('');

  const loadPhoto = async () => {
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const d = await res.json();
        setPhotoUrl(d.profile?.profile_photo_url || d.profile?.profile_photo_data_url || '');
      }
    } catch (e) {}
  };

  React.useEffect(() => {
    loadPhoto();
    window.addEventListener('profile-updated', loadPhoto);
    return () => window.removeEventListener('profile-updated', loadPhoto);
  }, []);

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/jobs', label: 'All Jobs', icon: Briefcase, count: counts.totalJobs },
    { href: '/kanban', label: 'Kanban Board', icon: KanbanSquare },
    { href: '/follow-ups', label: 'Follow-ups', icon: Clock, count: counts.followUpsDue, alert: counts.followUpsDue > 0 },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/integrations/google-sheets', label: 'Google Sheets', icon: CloudLightning, live: true },
    { href: '/import-export', label: 'Import / Export', icon: FileSpreadsheet },
    { href: '/profile', label: 'Profile & Resume', icon: UserCheck },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={`fixed top-0 bottom-0 left-0 z-30 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out ${
        collapsed ? 'w-18' : 'w-64'
      } hidden md:flex`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
        <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white leading-tight">
                JobHunt<span className="text-brand-500">.CRM</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                Dubai 2026 Edition
              </span>
            </div>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
              } ${collapsed ? 'justify-center px-2' : ''}`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
              {!collapsed && <span className="truncate flex-1">{item.label}</span>}
              {!collapsed && item.count !== undefined && item.count > 0 && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    item.alert
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {item.count}
                </span>
              )}
              {!collapsed && item.live && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
              )}
            </Link>
          );
        })}
      </div>

      {/* User Profile Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        {!collapsed ? (
          <div className="flex items-center justify-between gap-2">
            <Link href="/profile" className="flex items-center gap-2.5 min-w-0 group">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-brand-600/20 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-xs ring-1 ring-brand-500/30 shrink-0">
                {photoUrl ? (
                  <img src={photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  'AV'
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-brand-500 transition-colors">
                  {user?.name || 'Adarsh Vinothan'}
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] text-slate-400 font-medium truncate">
                    Dubai • Visit Visa
                  </span>
                </div>
              </div>
            </Link>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={logout}
            title="Logout"
            className="w-full flex justify-center p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
