import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  delta?: number;
  deltaLabel?: string;
  subtext?: string;
  status?: 'positive' | 'negative' | 'neutral' | 'critical';
  icon?: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  delta,
  deltaLabel,
  subtext,
  status = 'neutral',
  icon,
}) => {
  const getDeltaBadge = () => {
    if (delta === undefined) return null;
    if (delta > 0) {
      return (
        <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <ArrowUpRight className="w-3 h-3 mr-0.5" />
          +{delta}%
        </span>
      );
    } else if (delta < 0) {
      return (
        <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <ArrowDownRight className="w-3 h-3 mr-0.5" />
          {delta}%
        </span>
      );
    }
    return (
      <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
        <Minus className="w-3 h-3 mr-0.5" />
        0%
      </span>
    );
  };

  const getBorderColor = () => {
    if (status === 'critical') return 'border-rose-500/30 bg-rose-950/10';
    if (status === 'positive') return 'border-emerald-500/30 bg-emerald-950/10';
    return 'border-slate-800/80 bg-slate-900/40';
  };

  return (
    <div className={`p-4 rounded-xl border ${getBorderColor()} backdrop-blur-sm transition-all shadow-sm`}>
      <div className="flex items-center justify-between text-slate-400 mb-2">
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>
      <div className="flex items-baseline space-x-2">
        <span className="text-2xl font-bold tracking-tight text-white">{value}</span>
        {getDeltaBadge()}
      </div>
      {(subtext || deltaLabel) && (
        <p className="mt-1 text-xs text-slate-400">{deltaLabel || subtext}</p>
      )}
    </div>
  );
};
