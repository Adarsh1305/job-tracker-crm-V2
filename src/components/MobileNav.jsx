'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Briefcase,
  KanbanSquare,
  Clock,
  BarChart3,
  CloudLightning,
  FileSpreadsheet,
  UserCheck,
  Settings,
  X,
  Sparkles,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function MobileNav({ isOpen, onClose }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [photoUrl, setPhotoUrl] = React.useState('');

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
    { href: '/jobs', label: 'Jobs', icon: Briefcase },
    { href: '/kanban', label: 'Kanban', icon: KanbanSquare },
    { href: '/follow-ups', label: 'Follow-ups', icon: Clock },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/integrations/google-sheets', label: 'Google Sheets', icon: CloudLightning },
    { href: '/import-export', label: 'Import / Export', icon: FileSpreadsheet },
    { href: '/profile', label: 'Profile & Resume', icon: UserCheck },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 md:hidden flex items-center justify-around py-2 px-1">
        {[
          { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
          { href: '/jobs', label: 'Jobs', icon: Briefcase },
          { href: '/kanban', label: 'Kanban', icon: KanbanSquare },
          { href: '/follow-ups', label: 'Follow-ups', icon: Clock },
          { href: '/integrations/google-sheets', label: 'Sync', icon: CloudLightning },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
                isActive
                  ? 'text-brand-600 dark:text-brand-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Slide-over Drawer for Full Menu */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />
          <div className="relative w-72 max-w-[80vw] bg-white dark:bg-slate-900 h-full flex flex-col p-4 shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="font-bold text-base">JobHunt CRM</span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                      isActive
                        ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-brand-600/20 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-xs ring-1 ring-brand-500/30 shrink-0">
                  {photoUrl ? (
                    <img src={photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    'AV'
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold">{user?.name || 'Adarsh Vinothan'}</p>
                  <p className="text-[10px] text-slate-400">Dubai • Visit Visa</p>
                </div>
              </div>
              <button
                onClick={() => {
                  onClose();
                  logout();
                }}
                className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
