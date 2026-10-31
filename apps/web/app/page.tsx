'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import { TenantRole } from '@brightloop/shared-types';
import { Zap, Eye, EyeOff, ArrowRight, Shield } from 'lucide-react';
import Link from 'next/link';

export default function FormalLoginPage() {
  const router = useRouter();
  const { switchRole } = useApp();

  const [email, setEmail] = useState('vikram.mehta@acmesaas.in');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [activeRole, setActiveRole] = useState<TenantRole>(TenantRole.TENANT_ADMIN);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError('Please enter your work email.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      switchRole(activeRole);
      const destination =
        activeRole === TenantRole.CUSTOMER_PORTAL ? '/portal/home' : '/dashboard';
      router.push(destination);
    }, 400);
  };

  const handleSelectRole = (role: TenantRole, defaultEmail: string) => {
    setActiveRole(role);
    setEmail(defaultEmail);
    setPassword('Password123!');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#07080b] text-slate-100 flex flex-col justify-between items-center px-4 py-8 selection:bg-[#fcee21] selection:text-black">
      {/* Top Bar - Minimal */}
      <div className="w-full max-w-5xl flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="font-mono text-[11px] text-slate-400">Production Node · IN-BLR</span>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <Link href="/forgot-password" className="hover:text-slate-200 transition-colors">
            Forgot password?
          </Link>
          <span>•</span>
          <a
            href="mailto:support@brightloop.io"
            className="hover:text-slate-200 transition-colors"
          >
            Contact support
          </a>
        </div>
      </div>

      {/* Main Form Container - Centered, Executive, Pristine */}
      <div className="w-full max-w-[390px] my-auto">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#fcee21] text-black font-black shadow-lg shadow-[#fcee21]/15 mb-4">
            <Zap className="h-6 w-6 fill-current" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Sign in to Brightloop
          </h1>
          <p className="text-xs text-slate-400 mt-1.5">
            Enter your work credentials to access your organization
          </p>
        </div>

        {/* Executive Authentication Card */}
        <div className="bg-[#0b0e14] border border-[#1b2230] rounded-xl p-6 sm:p-7 shadow-2xl backdrop-blur-md">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-950/60 border border-red-500/30 text-red-200 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Work Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Work email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                placeholder="name@company.com"
                required
                className="w-full px-3.5 py-2.5 bg-[#121722] border border-[#1e2638] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#fcee21] focus:ring-1 focus:ring-[#fcee21] transition-colors"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-slate-300">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Reset
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="••••••••••••"
                  required
                  className="w-full px-3.5 pr-10 py-2.5 bg-[#121722] border border-[#1e2638] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#fcee21] focus:ring-1 focus:ring-[#fcee21] transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-[#1e2638] bg-[#121722] text-[#fcee21] focus:ring-[#fcee21] focus:ring-offset-0 cursor-pointer"
                />
                <span>Remember this device</span>
              </label>
            </div>

            {/* Sign In CTA */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 bg-[#fcee21] hover:bg-[#edd913] active:bg-[#d9c50a] text-black font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Single Sign-On Option */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#1a2130]" />
            </div>
            <div className="relative flex justify-center text-[11px]">
              <span className="px-2 bg-[#0b0e14] text-slate-400 uppercase tracking-widest font-mono text-[9px]">
                or
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleLogin({ preventDefault: () => {} } as any)}
            className="w-full py-2.5 px-4 bg-transparent hover:bg-[#121722] border border-[#1e2638] hover:border-slate-600 text-slate-300 font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Shield className="w-3.5 h-3.5 text-slate-400" />
            <span>Continue with Enterprise SSO</span>
          </button>

          {/* Discreet Role Selector (Clean, Minimal, Professional) */}
          <div className="mt-6 pt-4 border-t border-[#1a2130] flex items-center justify-between text-[11px] text-slate-400">
            <span>Fast sign-in:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  handleSelectRole(TenantRole.TENANT_ADMIN, 'vikram.mehta@acmesaas.in')
                }
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                  activeRole === TenantRole.TENANT_ADMIN
                    ? 'bg-[#fcee21]/20 text-[#fcee21] font-bold border border-[#fcee21]/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Admin
              </button>
              <span className="text-slate-400">/</span>
              <button
                type="button"
                onClick={() =>
                  handleSelectRole(TenantRole.TENANT_STAFF, 'priya.sharma@acmesaas.in')
                }
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                  activeRole === TenantRole.TENANT_STAFF
                    ? 'bg-sky-500/20 text-sky-400 font-bold border border-sky-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Staff
              </button>
              <span className="text-slate-400">/</span>
              <button
                type="button"
                onClick={() =>
                  handleSelectRole(TenantRole.CUSTOMER_PORTAL, 'billing@enterprise-corp.in')
                }
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                  activeRole === TenantRole.CUSTOMER_PORTAL
                    ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Portal
              </button>
            </div>
          </div>
        </div>

        {/* Security assurance note below card */}
        <p className="text-[11px] text-center text-slate-400 mt-5 flex items-center justify-center gap-1.5">
          <span>Protected by multi-tenant PostgreSQL Row-Level Security</span>
        </p>
      </div>

      {/* Corporate Footer - Ultra-Clean */}
      <footer className="w-full max-w-5xl flex flex-wrap items-center justify-between gap-4 text-[11px] text-slate-400 pt-6">
        <div>
          <span>&copy; {new Date().getFullYear()} Brightloop Technologies Inc.</span>
        </div>
        <div className="flex items-center gap-5">
          <Link href="/sign-in" className="hover:text-slate-400 transition-colors">
            Privacy
          </Link>
          <Link href="/sign-in" className="hover:text-slate-400 transition-colors">
            Terms
          </Link>
          <Link href="/sign-in" className="hover:text-slate-400 transition-colors">
            Security
          </Link>
          <Link href="/sign-in" className="hover:text-slate-400 transition-colors">
            Documentation
          </Link>
        </div>
      </footer>
    </div>
  );
}
