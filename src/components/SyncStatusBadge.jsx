'use client';

import React, { useState } from 'react';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

export default function SyncStatusBadge({ lastSyncTime, onSyncComplete, className = '' }) {
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');

  const triggerSync = async () => {
    if (syncing) return;
    setSyncing(true);
    setMessage('');
    try {
      const res = await fetch('/api/integrations/google-sheets/sync', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setMessage('Synced!');
        if (onSyncComplete) onSyncComplete(data);
      } else {
        setMessage('Sync error');
      }
    } catch (err) {
      setMessage('Failed');
    } finally {
      setTimeout(() => {
        setSyncing(false);
        setTimeout(() => setMessage(''), 3000);
      }, 600);
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 ${className}`}>
      <button
        onClick={triggerSync}
        disabled={syncing}
        title="Sync jobs from Google Sheets"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors border border-slate-200/80 dark:border-slate-700/80 shadow-xs"
      >
        <RefreshCw className={`w-3.5 h-3.5 text-brand-500 ${syncing ? 'animate-spin' : ''}`} />
        <span>{syncing ? 'Syncing...' : message || 'Sync Google Sheets'}</span>
      </button>

      {lastSyncTime && (
        <span className="hidden sm:inline-block text-[11px] text-slate-400">
          Last: {new Date(lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
  );
}
