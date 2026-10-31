import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  surface?: 'dark' | 'elevated' | 'light';
  bordered?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  surface = 'dark',
  bordered = true,
  className = '',
  ...props
}) => {
  const surfaceStyles = {
    // Jet black secondary container
    dark: 'bg-[#0d111a] text-slate-100',
    // Elevated card for active focus
    elevated: 'bg-[#151b28] text-slate-100',
    // Light neutral surface for long-form invoice inspection / tables
    light: 'bg-white text-slate-900 shadow-md',
  };

  const borderStyles = bordered
    ? surface === 'light'
      ? 'border border-slate-200'
      : 'border border-[#242f44]'
    : '';

  return (
    <div
      className={`rounded-xl p-5 transition-shadow ${surfaceStyles[surface]} ${borderStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
