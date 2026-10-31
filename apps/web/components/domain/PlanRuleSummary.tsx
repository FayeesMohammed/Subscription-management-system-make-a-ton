import React from 'react';
import { PlanDTO } from '@/mocks/types';
import { Check, X, Calendar, RefreshCw, Ban } from 'lucide-react';

interface Props {
  plan: PlanDTO;
  className?: string;
}

export const PlanRuleSummary: React.FC<Props> = ({ plan, className = '' }) => {
  return (
    <div className={`rounded-xl border border-[#242f44] bg-[#0d111a] p-4 text-xs space-y-3 ${className}`}>
      <div className="flex items-center justify-between border-b border-[#242f44] pb-2">
        <span className="font-bold uppercase tracking-wider text-slate-400">
          Billing Schedule & Commercial Rules
        </span>
        <span className="font-mono font-bold text-[#fcee21] uppercase text-[11px] px-2 py-0.5 rounded bg-[#fcee21]/10 border border-[#fcee21]/30">
          Every {plan.billingIntervalCount > 1 ? `${plan.billingIntervalCount} ` : ''}
          {plan.billingInterval}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-slate-300">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Interval:</span>
          <span className="font-semibold text-white capitalize">{plan.billingInterval}</span>
        </div>

        <div className="flex items-center gap-2">
          <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
          <span>Min Quantity:</span>
          <span className="font-semibold text-white font-mono">{plan.minQuantity} unit(s)</span>
        </div>

        <div className="flex items-center gap-2">
          {plan.allowPause ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <X className="w-3.5 h-3.5 text-slate-500" />
          )}
          <span>Pause Allowed:</span>
          <span className="font-semibold text-white">{plan.allowPause ? 'Yes' : 'No'}</span>
        </div>

        <div className="flex items-center gap-2">
          {plan.allowEarlyClose ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Ban className="w-3.5 h-3.5 text-rose-400" />
          )}
          <span>Early Close:</span>
          <span className="font-semibold text-white">{plan.allowEarlyClose ? 'Permitted' : 'Locked'}</span>
        </div>

        <div className="flex items-center gap-2 col-span-2">
          <span className="w-2 h-2 rounded-full bg-[#fcee21]" />
          <span>Auto-Close at Term:</span>
          <span className="font-semibold text-white">
            {plan.autoClose ? 'Yes (Auto closes at period end)' : 'No (Continuous recurring renewal)'}
          </span>
        </div>
      </div>
    </div>
  );
};
