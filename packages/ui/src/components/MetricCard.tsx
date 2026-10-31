import React from 'react';

export interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  subtext?: string;
  icon?: React.ReactNode;
  accent?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  changeType = 'neutral',
  subtext,
  icon,
  accent = false,
}) => {
  const changeColors = {
    positive: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40',
    negative: 'text-rose-400 bg-rose-950/40 border-rose-800/40',
    neutral: 'text-slate-400 bg-slate-800/40 border-slate-700/40',
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-5 transition-all ${
        accent
          ? 'bg-[#121622] border-[#fcee21]/60 shadow-[0_0_15px_rgba(252,238,33,0.12)]'
          : 'bg-[#0d111a] border-[#242f44]'
      }`}
    >
      {accent && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#fcee21]" />
      )}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        {icon && (
          <div
            className={`p-2 rounded-lg ${
              accent ? 'bg-[#fcee21]/15 text-[#fcee21]' : 'bg-[#151b28] text-slate-300'
            }`}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3">
        <span className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white font-mono tabular-nums">
          {value}
        </span>
      </div>

      {(change || subtext) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {change && (
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[11px] font-semibold font-mono ${changeColors[changeType]}`}
            >
              {change}
            </span>
          )}
          {subtext && <span className="text-slate-400">{subtext}</span>}
        </div>
      )}
    </div>
  );
};
