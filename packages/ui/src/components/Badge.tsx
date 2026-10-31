import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'draft' | 'quotation' | 'confirmed' | 'active' | 'closed' | 'paid' | 'void' | 'overdue' | 'yellow' | 'neutral';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  icon,
  className = '',
  ...props
}) => {
  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 gap-1 font-medium',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-semibold',
  };

  const variantStyles = {
    draft: 'bg-slate-800/80 text-slate-300 border border-slate-700/80',
    quotation: 'bg-sky-950/80 text-sky-300 border border-sky-800/80',
    confirmed: 'bg-amber-950/80 text-amber-300 border border-amber-800/80',
    active: 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80',
    closed: 'bg-slate-900 text-slate-400 border border-slate-800',
    paid: 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80',
    void: 'bg-rose-950/80 text-rose-300 border border-rose-800/80',
    overdue: 'bg-rose-950/90 text-rose-200 border border-rose-700 animate-pulse',
    yellow: 'bg-[#fcee21]/15 text-[#fcee21] border border-[#fcee21]/40',
    neutral: 'bg-[#151b28] text-slate-200 border border-[#242f44]',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full uppercase tracking-wider select-none ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
