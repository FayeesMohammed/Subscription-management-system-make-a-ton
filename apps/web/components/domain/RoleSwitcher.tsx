'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '@/lib/context';
import { useToast } from '@/lib/toast';
import { TenantRole } from '@brightloop/shared-types';
import { Shield, UserCheck, Globe, ChevronDown, Check } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

export const RoleSwitcher: React.FC = () => {
  const { role, switchRole } = useApp();
  const { info } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSelectRole = (newRole: TenantRole) => {
    switchRole(newRole);
    setIsOpen(false);
    info(`Switched Active Role to ${newRole}`, 'Navigation permissions updated dynamically.');

    if (newRole === TenantRole.CUSTOMER_PORTAL) {
      if (!pathname.startsWith('/portal')) {
        router.push('/portal/home');
      }
    } else {
      if (pathname.startsWith('/portal')) {
        router.push('/dashboard');
      }
    }
  };

  const roleMeta: Record<
    TenantRole,
    { label: string; sub: string; icon: React.ReactNode; color: string; badgeClass: string }
  > = {
    [TenantRole.TENANT_ADMIN]: {
      label: 'Admin',
      sub: 'Full Governance & Settings',
      icon: <Shield className="w-3.5 h-3.5 text-[#fcee21]" />,
      color: 'text-[#fcee21]',
      badgeClass: 'bg-[#fcee21]/15 text-[#fcee21] border-[#fcee21]/40',
    },
    [TenantRole.TENANT_STAFF]: {
      label: 'Staff',
      sub: 'Sales, Invoices & Customers',
      icon: <UserCheck className="w-3.5 h-3.5 text-sky-400" />,
      color: 'text-sky-400',
      badgeClass: 'bg-sky-950/80 text-sky-300 border-sky-800',
    },
    [TenantRole.CUSTOMER_PORTAL]: {
      label: 'Portal',
      sub: 'Customer Self-Service',
      icon: <Globe className="w-3.5 h-3.5 text-emerald-400" />,
      color: 'text-emerald-400',
      badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-800',
    },
    // Fallbacks
    [TenantRole.ADMIN]: {
      label: 'Admin',
      sub: 'Full Governance',
      icon: <Shield className="w-3.5 h-3.5 text-[#fcee21]" />,
      color: 'text-[#fcee21]',
      badgeClass: 'bg-[#fcee21]/15 text-[#fcee21] border-[#fcee21]/40',
    },
    [TenantRole.STAFF]: {
      label: 'Staff',
      sub: 'Operational Staff',
      icon: <UserCheck className="w-3.5 h-3.5 text-sky-400" />,
      color: 'text-sky-400',
      badgeClass: 'bg-sky-950/80 text-sky-300 border-sky-800',
    },
    [TenantRole.OWNER]: {
      label: 'Owner',
      sub: 'Platform Owner',
      icon: <Shield className="w-3.5 h-3.5 text-[#fcee21]" />,
      color: 'text-[#fcee21]',
      badgeClass: 'bg-[#fcee21]/15 text-[#fcee21] border-[#fcee21]/40',
    },
    [TenantRole.FINANCE]: {
      label: 'Finance',
      sub: 'Finance Lead',
      icon: <UserCheck className="w-3.5 h-3.5 text-sky-400" />,
      color: 'text-sky-400',
      badgeClass: 'bg-sky-950/80 text-sky-300 border-sky-800',
    },
    [TenantRole.MEMBER]: {
      label: 'Member',
      sub: 'Team Member',
      icon: <UserCheck className="w-3.5 h-3.5 text-sky-400" />,
      color: 'text-sky-400',
      badgeClass: 'bg-sky-950/80 text-sky-300 border-sky-800',
    },
    [TenantRole.VIEWER]: {
      label: 'Viewer',
      sub: 'Read-only Auditor',
      icon: <UserCheck className="w-3.5 h-3.5 text-sky-400" />,
      color: 'text-sky-400',
      badgeClass: 'bg-sky-950/80 text-sky-300 border-sky-800',
    },
  };

  const current = roleMeta[role] || roleMeta[TenantRole.TENANT_ADMIN];

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0e121a] hover:bg-[#161c28] border border-[#242f44] text-xs font-semibold text-slate-200 transition-all shadow-sm focus:outline-none focus:ring-1 focus:ring-[#fcee21]"
        aria-label="Active role selector"
      >
        {current.icon}
        <span className="hidden sm:inline text-slate-400 font-normal">Role:</span>
        <span className="font-bold text-white">{current.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl border border-[#242f44] bg-[#0c1017] p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2 py-1.5 border-b border-[#1b2333] mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Active Security Persona
            </span>
          </div>

          <div className="space-y-1">
            {[TenantRole.TENANT_ADMIN, TenantRole.TENANT_STAFF, TenantRole.CUSTOMER_PORTAL].map((r) => {
              const meta = roleMeta[r];
              const isSelected = role === r;
              return (
                <button
                  key={r}
                  onClick={() => handleSelectRole(r)}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                    isSelected ? 'bg-[#151c2a] border border-[#27354d]' : 'hover:bg-[#121620]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1 rounded bg-[#08090d] border border-[#242f44]">{meta.icon}</div>
                    <div>
                      <p className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                        {r}
                      </p>
                      <p className="text-[10px] text-slate-400">{meta.sub}</p>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-[#fcee21]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
