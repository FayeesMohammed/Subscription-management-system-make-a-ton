import React from 'react';
import Decimal from 'decimal.js';
import { MoneyDisplay } from './MoneyDisplay';

interface Props {
  collected: string;
  outstanding: string;
  overdue: string;
  currency?: string;
  className?: string;
}

export const ReceivablesIndicator: React.FC<Props> = ({
  collected,
  outstanding,
  overdue,
  currency = 'INR',
  className = '',
}) => {
  const col = new Decimal(collected || '0');
  const out = new Decimal(outstanding || '0');
  const total = col.plus(out);

  const colPct = total.isZero() ? 0 : col.dividedBy(total).times(100).toNumber();
  const outPct = total.isZero() ? 0 : out.dividedBy(total).times(100).toNumber();

  return (
    <div className={`rounded-xl border border-[#242f44] bg-[#0d111a] p-4 text-xs space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="font-bold uppercase tracking-wider text-slate-400">
          Receivables Realization Progress
        </span>
        <span className="font-mono font-bold text-white">
          {colPct.toFixed(1)}% Settled
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-2.5 w-full rounded-full bg-[#151b28] overflow-hidden flex">
        <div
          style={{ width: `${colPct}%` }}
          className="h-full bg-emerald-500 transition-all duration-300"
          title={`Collected: ${collected}`}
        />
        <div
          style={{ width: `${outPct}%` }}
          className="h-full bg-[#fcee21] transition-all duration-300"
          title={`Outstanding: ${outstanding}`}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 pt-1">
        <div className="space-y-0.5">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Collected
          </span>
          <MoneyDisplay amount={collected} currency={currency} size="sm" color="success" align="left" />
        </div>

        <div className="space-y-0.5">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#fcee21]" />
            Outstanding
          </span>
          <MoneyDisplay amount={outstanding} currency={currency} size="sm" color="yellow" align="left" />
        </div>

        <div className="space-y-0.5">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Overdue
          </span>
          <MoneyDisplay amount={overdue} currency={currency} size="sm" color="danger" align="left" />
        </div>
      </div>
    </div>
  );
};
