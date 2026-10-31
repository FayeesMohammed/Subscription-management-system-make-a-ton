'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import { TenantRole } from '@brightloop/shared-types';
import { Button, Card } from '@brightloop/ui';
import { Zap, Shield, UserCheck, Globe, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function RootIndexPage() {
  const router = useRouter();
  const { switchRole } = useApp();

  const handleLaunchRole = (role: TenantRole, destination: string) => {
    switchRole(role);
    router.push(destination);
  };

  return (
    <div className="min-h-screen bg-[#08090d] text-slate-100 flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-2xl space-y-8 text-center">
        {/* Brand Header */}
        <div className="space-y-3">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fcee21] text-black font-extrabold shadow-lg shadow-[#fcee21]/20">
            <Zap className="h-8 w-8 fill-current" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white">
            BRIGHTLOOP
          </h1>
          <p className="text-sm font-semibold uppercase tracking-widest text-[#fcee21] font-mono">
            Subscription Management &amp; Recurring Billing System
          </p>
          <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
            UI-First Implementation Blueprint with deterministic mock repositories, role-aware routing,
            contract lifecycle state machine, and immutable financial invoice snapshots.
          </p>
        </div>

        {/* Role Persona Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          {/* Tenant Admin */}
          <button
            onClick={() => handleLaunchRole(TenantRole.TENANT_ADMIN, '/dashboard')}
            className="group flex flex-col justify-between p-5 rounded-xl bg-[#0d111a] hover:bg-[#151b28] border border-[#242f44] hover:border-[#fcee21] transition-all cursor-pointer shadow-md text-left"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-[#fcee21]/15 text-[#fcee21]">
                  <Shield className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold uppercase text-[#fcee21]">
                  Admin
                </span>
              </div>
              <h2 className="text-sm font-bold text-white group-hover:text-[#fcee21]">
                TENANT_ADMIN
              </h2>
              <p className="text-[11px] text-slate-400 leading-normal">
                Full governance: Staff invites, discount authoring, catalog pricing, and financial reporting.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#242f44] flex items-center justify-between text-xs font-bold text-[#fcee21]">
              <span>Enter Workspace</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Tenant Staff */}
          <button
            onClick={() => handleLaunchRole(TenantRole.TENANT_STAFF, '/dashboard')}
            className="group flex flex-col justify-between p-5 rounded-xl bg-[#0d111a] hover:bg-[#151b28] border border-[#242f44] hover:border-sky-400 transition-all cursor-pointer shadow-md text-left"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-sky-950 text-sky-400 border border-sky-800">
                  <UserCheck className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold uppercase text-sky-400">
                  Staff
                </span>
              </div>
              <h2 className="text-sm font-bold text-white group-hover:text-sky-300">
                TENANT_STAFF
              </h2>
              <p className="text-[11px] text-slate-400 leading-normal">
                Day-to-day operations: Customers, quotations, subscription lifecycle, and manual payments.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#242f44] flex items-center justify-between text-xs font-bold text-sky-400">
              <span>Enter Workspace</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Customer Portal */}
          <button
            onClick={() => handleLaunchRole(TenantRole.CUSTOMER_PORTAL, '/portal/home')}
            className="group flex flex-col justify-between p-5 rounded-xl bg-[#0d111a] hover:bg-[#151b28] border border-[#242f44] hover:border-emerald-400 transition-all cursor-pointer shadow-md text-left"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800">
                  <Globe className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold uppercase text-emerald-400">
                  Portal
                </span>
              </div>
              <h2 className="text-sm font-bold text-white group-hover:text-emerald-300">
                CUSTOMER_PORTAL
              </h2>
              <p className="text-[11px] text-slate-400 leading-normal">
                Self-service: Inspect own active subscriptions, review/accept quotations, download tax invoices.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#242f44] flex items-center justify-between text-xs font-bold text-emerald-400">
              <span>Open Portal</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>

        {/* Direct Link to Sign In */}
        <div className="pt-2 text-xs text-slate-400">
          <span>Standard authentication screens: </span>
          <Link href="/sign-in" className="text-[#fcee21] hover:underline font-bold">
            Sign In Form
          </Link>
          <span className="mx-2">•</span>
          <Link href="/forgot-password" className="text-slate-300 hover:underline">
            Forgot Password
          </Link>
          <span className="mx-2">•</span>
          <Link href="/reset-password" className="text-slate-300 hover:underline">
            Reset Password
          </Link>
        </div>
      </div>
    </div>
  );
}
