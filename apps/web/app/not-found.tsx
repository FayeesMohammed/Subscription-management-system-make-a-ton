import React from 'react';
import Link from 'next/link';
import { Button } from '@brightloop/ui';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#08090d] text-slate-100 flex flex-col justify-center items-center p-6 text-center">
      <div className="p-4 rounded-full bg-[#151b28] text-[#fcee21] mb-4 border border-[#242f44]">
        <FileQuestion className="w-10 h-10" />
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight text-white">
        404 — Page Not Found
      </h1>
      <p className="mt-2 text-xs text-slate-400 max-w-sm">
        The requested URL does not exist or has been relocated within the workspace.
      </p>
      <div className="mt-6">
        <Link href="/dashboard">
          <Button variant="primary" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Return to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
