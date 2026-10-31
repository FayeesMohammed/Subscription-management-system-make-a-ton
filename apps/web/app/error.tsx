'use client';

import React, { useEffect } from 'react';
import { Button } from '@brightloop/ui';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled UI Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#08090d] text-slate-100 flex flex-col justify-center items-center p-6 text-center">
      <div className="p-4 rounded-full bg-rose-950/60 text-rose-400 mb-4 border border-rose-800">
        <AlertTriangle className="w-10 h-10" />
      </div>
      <h1 className="text-2xl font-extrabold tracking-tight text-white">
        System Rendering Error
      </h1>
      <p className="mt-2 text-xs text-slate-400 max-w-sm">
        {error.message || 'An unexpected operational error occurred while rendering this interface.'}
      </p>
      {error.digest && (
        <p className="mt-1 text-[10px] font-mono text-slate-500">
          Digest ID: {error.digest}
        </p>
      )}
      <div className="mt-6">
        <Button
          variant="primary"
          size="md"
          leftIcon={<RefreshCw className="w-4 h-4" />}
          onClick={() => reset()}
        >
          Retry View
        </Button>
      </div>
    </div>
  );
}
