import React from 'react';
import { ArrowUp, ArrowRight, ArrowDown } from 'lucide-react';

export default function PriorityBadge({ priority = 'medium', showIcon = true, size = 'sm' }) {
  const p = (priority || 'medium').toLowerCase();

  const config = {
    high: {
      label: 'High',
      styles: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      icon: ArrowUp,
    },
    medium: {
      label: 'Medium',
      styles: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      icon: ArrowRight,
    },
    low: {
      label: 'Low',
      styles: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
      icon: ArrowDown,
    },
  }[p] || {
    label: p,
    styles: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    icon: ArrowRight,
  };

  const Icon = config.icon;
  const sizeClass = size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5';

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded border ${config.styles} ${sizeClass}`}
    >
      {showIcon && <Icon className="w-3 h-3" />}
      <span>{config.label}</span>
    </span>
  );
}
