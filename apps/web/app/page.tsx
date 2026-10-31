'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import { TenantRole } from '@brightloop/shared-types';
import {
  Zap,
  Shield,
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  Building2,
  Sparkles,
  Globe,
  UserCheck,
  KeyRound,
  HelpCircle,
} from 'lucide-react';
import Link from 'next/link';

interface PersonaPreset {
  role: TenantRole;
  label: string;
  badge: string;
  email: string;
  name: string;
  destination: string;
  description: string;
  color: string;
  borderColor: string;
  icon: React.ReactNode;
}

const PERSONA_PRESETS: PersonaPreset[] = [
  {
    role: TenantRole.TENANT_ADMIN,
    label: 'Tenant Admin',
    badge: 'Admin Access',
    email: 'vikram.mehta@acmesaas.in',
    name: 'Vikram Mehta',
    destination: '/dashboard',
    description: 'Full governance, staff invitations, catalog, and finance controls',
    color: 'text-[#fcee21]',
    borderColor: 'border-[#fcee21]/40 hover:border-[#fcee21]',
    icon: <Shield className="w-4 h-4 text-[#fcee21]" />,
  },
  {
    role: TenantRole.TENANT_STAFF,
    label: 'Operations Staff',
    badge: 'Staff Access',
    email: 'priya.sharma@acmesaas.in',
    name: 'Priya Sharma',
    destination: '/dashboard',
    description: 'Sales quotations, subscription lifecycle, and manual payments',
    color: 'text-sky-400',
    borderColor: 'border-sky-500/40 hover:border-sky-400',
    icon: <UserCheck className="w-4 h-4 text-sky-400" />,
  },
  {
    role: TenantRole.CUSTOMER_PORTAL,
    label: 'Customer Portal',
    badge: 'Client Portal',
    email: 'billing@enterprise-corp.in',
    name: 'Rajesh Iyer',
    destination: '/portal/home',
    description: 'Review contracts, accept quotations, download tax invoices',
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/40 hover:border-emerald-400',
    icon: <Globe className="w-4 h-4 text-emerald-400" />,
  },
];

export default function ProfessionalLoginPage() {
  const router = useRouter();
  const { switchRole } = useApp();

  const [email, setEmail] = useState('vikram.mehta@acmesaas.in');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [selectedRole, setSelectedRole] = useState<TenantRole>(TenantRole.TENANT_ADMIN);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectPersona = (preset: PersonaPreset) => {
    setEmail(preset.email);
    setPassword('Password123!');
    setSelectedRole(preset.role);
    setError(null);
  };

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!email.trim()) {
      setError('Please provide a valid work email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      switchRole(selectedRole);
      const destination =
        selectedRole === TenantRole.CUSTOMER_PORTAL ? '/portal/home' : '/dashboard';
      router.push(destination);
    }, 450);
  };

  const handleQuickLaunch = (preset: PersonaPreset) => {
    handleSelectPersona(preset);
    setIsLoading(true);
    setTimeout(() => {
      switchRole(preset.role);
      router.push(preset.destination);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-[#08090d] text-slate-100 flex flex-col justify-between selection:bg-[#fcee21] selection:text-black">
      {/* Subtle Ambient Background Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#fcee21]/5 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-sky-500/5 rounded-full blur-[140px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#1c2436_1px,transparent_1px)] [background-size:24px_24px] opacity-15" />
      </div>

      {/* Top Navbar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fcee21] text-black font-extrabold shadow-lg shadow-[#fcee21]/20 group-hover:scale-105 transition-transform">
            <Zap className="h-6 w-6 fill-current" />
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-white block leading-none">
              BRIGHTLOOP
            </span>
            <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase mt-0.5 block">
              Enterprise Billing
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-4 text-xs">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0d111a] border border-[#242f44] text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px]">System Status: All Services Operational</span>
          </div>
          <Link
            href="/sign-in"
            className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Support</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 py-8 flex-1 flex items-center justify-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Brand & Security Proof Points (Desktop) */}
          <div className="hidden lg:flex lg:col-span-6 flex-col space-y-8 pr-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#fcee21]/10 border border-[#fcee21]/30 text-[#fcee21] text-xs font-semibold w-fit">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Financial-Grade Subscription Management</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl xl:text-5xl font-black tracking-tight text-white leading-tight">
                Enterprise recurring billing with{' '}
                <span className="text-[#fcee21]">absolute financial precision.</span>
              </h1>
              <p className="text-slate-400 text-sm leading-relaxed max-w-lg">
                Manage high-velocity subscription lifecycles, automated contract quotations,
                multi-tier catalog pricing, and immutable tax invoicing backed by PostgreSQL
                row-level security.
              </p>
            </div>

            {/* Architecture Highlights */}
            <div className="space-y-3.5 pt-2">
              <div className="flex items-start gap-3">
                <div className="p-1 rounded-md bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-200">
                    PostgreSQL Row-Level Security (RLS)
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Cryptographically isolated tenant contexts on every query without data leakage risks.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1 rounded-md bg-sky-950/80 border border-sky-500/30 text-sky-400 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-200">
                    Immutable Finalized Invoices &amp; Trigger Protection
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Database triggers lock monetary snapshots permanently. Adjustments handled via credit notes.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1 rounded-md bg-[#fcee21]/15 border border-[#fcee21]/40 text-[#fcee21] mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-200">
                    Sub-2-Second Finance Reporting SLA
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Live normalized MRR, overdue receivables, and instant gateway vs. offline payment breakdown.
                  </p>
                </div>
              </div>
            </div>

            {/* Client Testimonial Card */}
            <div className="p-5 rounded-2xl bg-[#0d111a]/80 border border-[#242f44] backdrop-blur-sm space-y-3">
              <p className="text-xs text-slate-300 italic leading-relaxed">
                &ldquo;Brightloop eliminated billing discrepancies across our enterprise contracts.
                The quotation pipeline and dual-mode portal give both our finance team and customers
                flawless clarity.&rdquo;
              </p>
              <div className="flex items-center gap-3 pt-1">
                <div className="w-8 h-8 rounded-full bg-[#1c2436] border border-[#242f44] flex items-center justify-center font-bold text-xs text-[#fcee21]">
                  AK
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Ananya Kulkarni</h3>
                  <p className="text-[10px] text-slate-400">Head of Finance Operations, CloudMatrix India</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Premium Executive Login Card */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-md bg-[#0d111a] border border-[#242f44] rounded-2xl p-7 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
              {/* Header */}
              <div className="space-y-2 mb-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black tracking-tight text-white">
                    Sign In
                  </h2>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[#151b28] border border-[#242f44] text-slate-300">
                    <Lock className="w-3 h-3 text-[#fcee21]" />
                    TLS 256-bit
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Enter your verified credentials to access your organization workspace.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-5 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                  <span>{error}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Work Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Work Email Address</span>
                    <span className="text-[10px] text-slate-500 font-mono">Required</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError(null);
                      }}
                      placeholder="name@company.com"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-[#151b28] border border-[#242f44] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#fcee21] focus:ring-1 focus:ring-[#fcee21] transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">
                      Password
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-[#fcee21] hover:underline font-semibold transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError(null);
                      }}
                      placeholder="••••••••••••"
                      required
                      className="w-full pl-10 pr-10 py-2.5 bg-[#151b28] border border-[#242f44] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#fcee21] focus:ring-1 focus:ring-[#fcee21] transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember device checkbox */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2.5 text-xs text-slate-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-[#242f44] bg-[#151b28] text-[#fcee21] focus:ring-[#fcee21] focus:ring-offset-0 cursor-pointer"
                    />
                    <span>Remember this session for 30 days</span>
                  </label>
                </div>

                {/* Primary Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-3 px-4 bg-[#fcee21] hover:bg-[#edd913] active:bg-[#d9c50a] text-black font-extrabold text-sm rounded-xl transition-all shadow-lg shadow-[#fcee21]/15 hover:shadow-[#fcee21]/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Authenticating Workspace...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Workspace</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              {/* Single Sign On Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#1f283d]" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-[#0d111a] text-slate-500 font-mono uppercase text-[10px] tracking-wider">
                    Demo Fast-Track Persona
                  </span>
                </div>
              </div>

              {/* Fast-Track Role Selector Pills (Refined & Professional) */}
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  {PERSONA_PRESETS.map((preset) => {
                    const isSelected = selectedRole === preset.role;
                    return (
                      <button
                        key={preset.role}
                        type="button"
                        onClick={() => handleQuickLaunch(preset)}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all text-center cursor-pointer ${
                          isSelected
                            ? `bg-[#151b28] ${preset.borderColor} ring-1 ring-[#fcee21]/30`
                            : 'bg-[#0d111a] border-[#242f44] hover:bg-[#151b28]/60 text-slate-400'
                        }`}
                      >
                        <div className="mb-1">{preset.icon}</div>
                        <span className="text-[11px] font-bold text-white block leading-tight">
                          {preset.label}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono mt-0.5">
                          {preset.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-center text-slate-400">
                  Select a persona for 1-click test authentication with pre-configured roles.
                </p>
              </div>

              {/* Card Footer Security Indicator */}
              <div className="mt-6 pt-4 border-t border-[#1c2436] flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Argon2id Hash Protected
                </span>
                <span className="text-slate-400">v2.0 Architecture</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Global Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 border-t border-[#1c2436] flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-slate-300">Brightloop Inc.</span>
          <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
          <span className="hidden md:inline text-slate-400">•</span>
          <span className="hidden md:inline">Multi-Tenant PostgreSQL RLS Enforced</span>
        </div>

        <div className="flex items-center gap-6">
          <Link href="/sign-in" className="hover:text-slate-200 transition-colors">
            Privacy Policy
          </Link>
          <Link href="/sign-in" className="hover:text-slate-200 transition-colors">
            Terms of Service
          </Link>
          <Link href="/sign-in" className="hover:text-slate-200 transition-colors">
            Documentation
          </Link>
          <Link href="/forgot-password" className="text-[#fcee21] hover:underline">
            Password Reset
          </Link>
        </div>
      </footer>
    </div>
  );
}
