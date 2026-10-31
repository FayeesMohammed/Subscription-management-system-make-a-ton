import React from 'react';
import { Lock, ShieldAlert } from 'lucide-react';

interface Props {
  status: string;
  className?: string;
}

export const InvoiceLockNotice: React.FC<Props> = ({ status, className = '' }) => {
  const norm = status.toLowerCase();
  const isLocked = norm === 'confirmed' || norm === 'paid' || norm === 'finalized' || norm === 'void';

  if (!isLocked) return null;

  return (
    <div
      role="status"
      className={`flex items-start gap-3 p-4 rounded-xl border border-amber-800/80 bg-amber-950/30 text-amber-200 ${className}`}
    >
      <div className="p-2 rounded-lg bg-amber-900/50 text-amber-300 shrink-0">
        <Lock className="w-5 h-5" />
      </div>
      <div className="flex-1 text-xs">
        <div className="flex items-center gap-2">
          <h4 className="font-bold text-white text-sm">
            Immutable Financial Document
          </h4>
          <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-amber-900/60 text-amber-200 border border-amber-700">
            {status}
          </span>
        </div>
        <p className="mt-1 text-slate-300 leading-relaxed">
          This invoice has been confirmed and locked to ensure regulatory and financial audit compliance.
          Historical snapshot lines, tax calculations, and pricing are permanent and cannot be modified.
          To adjust settled amounts, record manual payments below or issue authorized credit notes.
        </p>
      </div>
    </div>
  );
};
