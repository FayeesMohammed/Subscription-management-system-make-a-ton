import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

export interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error' | 'yellow';
  title?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  className = '',
  action,
}) => {
  const variantConfig = {
    info: {
      container: 'bg-sky-950/40 border-sky-800/80 text-sky-200',
      icon: <Info className="h-5 w-5 text-sky-400 shrink-0" />,
    },
    success: {
      container: 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200',
      icon: <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />,
    },
    warning: {
      container: 'bg-amber-950/40 border-amber-800/80 text-amber-200',
      icon: <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />,
    },
    error: {
      container: 'bg-rose-950/40 border-rose-800/80 text-rose-200',
      icon: <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />,
    },
    yellow: {
      container: 'bg-[#fcee21]/10 border-[#fcee21]/40 text-slate-100',
      icon: <AlertTriangle className="h-5 w-5 text-[#fcee21] shrink-0" />,
    },
  };

  const { container, icon } = variantConfig[variant];

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-4 rounded-xl border ${container} ${className}`}
    >
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1 text-xs">
        {title && <h4 className="font-bold text-white text-sm mb-1">{title}</h4>}
        <div className="leading-relaxed">{children}</div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};
