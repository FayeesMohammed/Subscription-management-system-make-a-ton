'use client';

import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '@brightloop/ui';
import Link from 'next/link';
import { useApp } from '@/lib/context';

interface Props {
  title?: string;
  message?: string;
  requiredCapability?: string;
}

export const AccessDeniedNotice: React.FC<Props> = ({
  title = 'Restricted Workspace Area',
  message = 'Your active role does not possess the administrative privileges required to access or modify this resource.',
  requiredCapability,
}) => {
  const { role } = useApp();

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-[#242f44] bg-[#0d111a] max-w-xl mx-auto my-12">
      <div className="p-3.5 rounded-full bg-rose-950/60 text-rose-400 mb-4 border border-rose-800/80">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
      <p className="mt-2 text-xs text-slate-400 max-w-md leading-relaxed">{message}</p>

      <div className="mt-4 px-3 py-1.5 rounded-lg bg-[#08090d] border border-[#242f44] text-[11px] text-slate-400">
        Active Role: <span className="font-mono font-bold text-[#fcee21]">{role}</span>
        {requiredCapability && (
          <span className="ml-2">
            | Missing Capability:{' '}
            <span className="font-mono text-rose-400">{requiredCapability}</span>
          </span>
        )}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Link href="/dashboard">
          <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Return to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};
