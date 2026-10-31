'use client';

import React, { useState } from 'react';
import { Button, Input, Card, Alert } from '@brightloop/ui';
import { useApp } from '@/lib/context';
import { TenantRole } from '@brightloop/shared-types';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, UserCheck, Globe, LogIn } from 'lucide-react';

export default function SignInPage() {
  const { switchRole } = useApp();
  const router = useRouter();
  const [email, setEmail] = useState('vikram.mehta@acmesaas.in');
  const [password, setPassword] = useState('••••••••');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide a valid work email and password.');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push('/dashboard');
    }, 400);
  };

  const handleQuickLogin = (role: TenantRole) => {
    switchRole(role);
    if (role === TenantRole.CUSTOMER_PORTAL) {
      router.push('/portal/home');
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <Card surface="dark" className="border border-[#242f44] p-6 space-y-6 shadow-2xl">
      <div className="space-y-1 text-center">
        <h2 className="text-xl font-bold tracking-tight text-white">Sign In to Brightloop</h2>
        <p className="text-xs text-slate-400">
          Enter your tenant credentials or select a mock role persona.
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Work Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              defaultChecked
              className="rounded border-[#242f44] text-[#fcee21] focus:ring-[#fcee21]"
            />
            <span>Remember device</span>
          </label>
          <Link
            href="/forgot-password"
            className="text-xs text-[#fcee21] hover:underline font-semibold"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          variant="primary"
          size="md"
          className="w-full"
          leftIcon={<LogIn className="w-4 h-4" />}
          type="submit"
          isLoading={isLoading}
        >
          Sign In
        </Button>
      </form>

      {/* Quick Role Persona Selector */}
      <div className="space-y-3 pt-3 border-t border-[#242f44]">
        <span className="block text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Instant Role Persona Switcher
        </span>
        <div className="grid grid-cols-1 gap-2">
          <button
            type="button"
            onClick={() => handleQuickLogin(TenantRole.TENANT_ADMIN)}
            className="flex items-center justify-between p-2.5 rounded-lg bg-[#151b28] hover:bg-[#1c2436] border border-[#242f44] text-xs transition-colors"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#fcee21]" />
              <div className="text-left">
                <span className="font-bold text-white block">Vikram Mehta</span>
                <span className="text-[10px] text-slate-400">TENANT_ADMIN (Full Governance)</span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-[#fcee21] font-mono">Launch →</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickLogin(TenantRole.TENANT_STAFF)}
            className="flex items-center justify-between p-2.5 rounded-lg bg-[#151b28] hover:bg-[#1c2436] border border-[#242f44] text-xs transition-colors"
          >
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-sky-400" />
              <div className="text-left">
                <span className="font-bold text-white block">Priya Sharma</span>
                <span className="text-[10px] text-slate-400">TENANT_STAFF (Sales &amp; Invoices)</span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-sky-300 font-mono">Launch →</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickLogin(TenantRole.CUSTOMER_PORTAL)}
            className="flex items-center justify-between p-2.5 rounded-lg bg-[#151b28] hover:bg-[#1c2436] border border-[#242f44] text-xs transition-colors"
          >
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400" />
              <div className="text-left">
                <span className="font-bold text-white block">Enterprise Client Corp</span>
                <span className="text-[10px] text-slate-400">CUSTOMER_PORTAL (Self-Service)</span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-300 font-mono">Launch →</span>
          </button>
        </div>
      </div>
    </Card>
  );
}
