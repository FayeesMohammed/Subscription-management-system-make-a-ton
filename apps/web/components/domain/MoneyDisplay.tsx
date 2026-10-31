import React from 'react';
import { formatMoney } from '@/lib/formatters';

interface Props {
  amount: string | number;
  currency?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  align?: 'left' | 'right' | 'center';
  color?: 'default' | 'yellow' | 'success' | 'danger' | 'muted';
  className?: string;
}

export const MoneyDisplay: React.FC<Props> = ({
  amount,
  currency = 'INR',
  size = 'md',
  align = 'right',
  color = 'default',
  className = '',
}) => {
  const formatted = formatMoney(amount, currency);

  const sizeStyles = {
    sm: 'text-xs font-semibold',
    md: 'text-sm font-bold',
    lg: 'text-lg font-extrabold',
    xl: 'text-2xl font-extrabold',
  };

  const alignStyles = {
    left: 'text-left',
    right: 'text-right',
    center: 'text-center',
  };

  const colorStyles = {
    default: 'text-white',
    yellow: 'text-[#fcee21]',
    success: 'text-emerald-400',
    danger: 'text-rose-400',
    muted: 'text-slate-400',
  };

  return (
    <span
      className={`font-mono tabular-nums tracking-tight ${sizeStyles[size]} ${alignStyles[align]} ${colorStyles[color]} ${className}`}
    >
      {formatted}
    </span>
  );
};
