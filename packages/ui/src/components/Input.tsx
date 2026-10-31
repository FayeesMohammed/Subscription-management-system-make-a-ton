import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftAddon, rightAddon, id, className = '', ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
          >
            {label}
            {props.required && <span className="ml-1 text-[#fcee21]">*</span>}
          </label>
        )}
        <div className="relative flex items-center rounded-lg border border-[#242f44] bg-[#08090d] focus-within:border-[#fcee21] focus-within:ring-1 focus-within:ring-[#fcee21] transition-all">
          {leftAddon && (
            <span className="flex items-center pl-3 pr-2 text-slate-400 select-none text-sm">
              {leftAddon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`w-full bg-transparent px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
            {...props}
          />
          {rightAddon && (
            <span className="flex items-center pr-3 pl-2 text-slate-400 select-none text-sm">
              {rightAddon}
            </span>
          )}
        </div>
        {error && <p className="text-xs font-medium text-rose-400">{error}</p>}
        {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';
