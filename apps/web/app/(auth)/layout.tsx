import React from 'react';
import Link from 'next/link';
import { Zap } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#08090d] text-slate-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fcee21] text-black font-extrabold shadow-md">
              <Zap className="h-6 w-6 fill-current" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white">
              BRIGHTLOOP
            </span>
          </Link>
          <p className="text-xs text-slate-400 uppercase tracking-widest font-mono">
            Subscription Management &amp; Billing
          </p>
        </div>

        {children}
      </div>
    </div>
  );
}
