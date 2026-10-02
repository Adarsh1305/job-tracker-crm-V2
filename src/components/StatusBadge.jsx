import React from 'react';

const STAGE_STYLES = {
  new: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  interested: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
  preparing: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  applied: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
  screening: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
  interview: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  tech_interview: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
  hr_interview: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
  offer: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-semibold',
  rejected: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  closed_expired: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
  not_pursuing: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20',
};

const STAGE_DOTS = {
  new: 'bg-blue-500',
  interested: 'bg-indigo-500',
  preparing: 'bg-purple-500',
  applied: 'bg-cyan-500',
  screening: 'bg-yellow-500',
  interview: 'bg-amber-500',
  tech_interview: 'bg-orange-500',
  hr_interview: 'bg-pink-500',
  offer: 'bg-emerald-500',
  rejected: 'bg-red-500',
  closed_expired: 'bg-slate-400',
  not_pursuing: 'bg-zinc-400',
};

export default function StatusBadge({ stage, name, size = 'sm', className = '' }) {
  const style = STAGE_STYLES[stage] || 'bg-slate-500/10 text-slate-500 border-slate-500/20';
  const dotColor = STAGE_DOTS[stage] || 'bg-slate-400';
  const sizeClass = size === 'xs' ? 'text-[11px] px-2 py-0.5' : size === 'lg' ? 'text-sm px-3 py-1' : 'text-xs px-2.5 py-0.5';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border whitespace-nowrap ${style} ${sizeClass} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span>{name || stage}</span>
    </span>
  );
}
