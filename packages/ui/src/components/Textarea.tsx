import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, id, className = '', rows = 3, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
          >
            {label}
            {props.required && <span className="ml-1 text-[#fcee21]">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={`w-full rounded-lg border border-[#242f44] bg-[#08090d] px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-[#fcee21] focus:outline-none focus:ring-1 focus:ring-[#fcee21] disabled:opacity-50 disabled:cursor-not-allowed transition-all ${className}`}
          {...props}
        />
        {error && <p className="text-xs font-medium text-rose-400">{error}</p>}
        {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
