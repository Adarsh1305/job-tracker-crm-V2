import React from 'react';
import { Flame, CheckCircle2, Compass } from 'lucide-react';

export default function MatchScoreBadge({ score = 0, classification = '', size = 'md' }) {
  const numScore = parseInt(score, 10) || 0;

  let colorClasses = 'bg-slate-500/10 text-slate-500 border-slate-500/20';
  let Icon = Compass;

  if (numScore >= 85) {
    colorClasses = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 font-semibold';
    Icon = Flame;
  } else if (numScore >= 70) {
    colorClasses = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-medium';
    Icon = CheckCircle2;
  } else if (numScore >= 50) {
    colorClasses = 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    Icon = Compass;
  }

  if (size === 'sm') {
    return (
      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${colorClasses}`}>
        <Icon className="w-3 h-3" />
        <span>{numScore}%</span>
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${colorClasses}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <div className="flex flex-col">
        <span className="text-xs leading-none font-bold">{numScore}%</span>
      </div>
    </div>
  );
}
