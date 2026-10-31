'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Package,
  Layers,
  Percent,
  FileSignature,
  Send,
  FileSpreadsheet,
  Receipt,
  CreditCard,
  BarChart3,
  Settings,
  UserPlus,
  Menu,
  Zap,
  Building,
  ChevronRight,
  Bell,
  Clock,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { Drawer } from '@brightloop/ui';
import { RoleSwitcher } from '@/components/domain/RoleSwitcher';
import { ScenarioSwitcher } from '@/components/domain/ScenarioSwitcher';
import { CommandPalette } from '@/components/domain/CommandPalette';
import { useApp } from '@/lib/context';
import { TenantRole } from '@brightloop/shared-types';
import { mockRepo } from '@/mocks/repository';

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, role, can, scenario, refreshKey } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [alertsCount, setAlertsCount] = useState(0);

  useEffect(() => {
    async function checkAlerts() {
      const invs = await mockRepo.getInvoices();
      const subs = await mockRepo.getSubscriptions();
      let count = 0;
      if (invs.some((i) => i.isOverdue)) count++;
      if (subs.some((s) => s.validUntil && new Date(s.validUntil).getTime() - Date.now() < 24 * 3600 * 1000)) {
        count++;
      }
      setAlertsCount(count);
    }
    checkAlerts();
  }, [scenario, refreshKey]);

  const navSections = [
    {
      title: 'Overview',
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'Commercial Work',
      items: [
        { label: 'Customers Directory', href: '/customers', icon: Users },
        { label: 'Quotations', href: '/sales/quotes', icon: Send },
        { label: 'Subscriptions Pipeline', href: '/sales/subscriptions', icon: FileSignature },
        { label: 'Contract Templates', href: '/sales/templates', icon: FileSpreadsheet },
      ],
    },
    {
      title: 'Catalog Management',
      items: [
        { label: 'Products & Variants', href: '/catalog/products', icon: Package },
        { label: 'Billing Plans', href: '/catalog/plans', icon: Layers },
        {
          label: 'Discount Rules',
          href: '/catalog/discounts',
          icon: Percent,
          badge: can('discount:write') ? undefined : 'Read-only',
        },
      ],
    },
    {
      title: 'Finance & Ledger',
      items: [
        { label: 'Invoices & Receivables', href: '/finance/invoices', icon: Receipt },
        { label: 'Manual Payments Ledger', href: '/finance/payments', icon: CreditCard },
        { label: 'Financial Reports', href: '/finance/reports', icon: BarChart3 },
      ],
    },
    {
      title: 'Governance',
      items: [
        { label: 'Tenant Organization', href: '/settings', icon: Settings },
        ...(role === TenantRole.TENANT_ADMIN
          ? [{ label: 'Team & Staff Roles', href: '/settings/staff', icon: UserPlus }]
          : []),
      ],
    },
  ];

  const renderNavLinks = () => (
    <div className="space-y-6">
      {navSections.map((section, idx) => (
        <div key={idx} className="space-y-1">
          <span className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 select-none">
            {section.title}
          </span>
          <div className="space-y-0.5 pt-1">
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`group relative flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold tracking-tight transition-all select-none ${
                    isActive
                      ? 'bg-[#fcee21] text-black font-extrabold shadow-[0_0_12px_rgba(252,238,33,0.22)]'
                      : 'text-slate-300 hover:bg-[#141824] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`h-4 w-4 shrink-0 transition-colors ${
                        isActive ? 'text-black' : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-mono uppercase ${
                        isActive
                          ? 'bg-black/15 text-black font-bold'
                          : 'bg-[#1b2333] text-slate-400 border border-[#242f44]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#08090d] text-slate-100">
      {/* Persistent Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-[#1f283d] bg-[#07080b] shrink-0 sticky top-0 h-screen">
        {/* Brand Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1f283d]">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fcee21] text-black font-extrabold shadow-[0_0_15px_rgba(252,238,33,0.3)] group-hover:scale-105 transition-transform">
              <Zap className="h-5 w-5 fill-current" />
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-white block leading-none">
                BRIGHTLOOP
              </span>
              <span className="block text-[9px] font-mono uppercase tracking-widest text-[#fcee21] font-bold mt-1">
                Recurring Billing
              </span>
            </div>
          </Link>
        </div>

        {/* Tenant Profile Badge */}
        <div className="px-3.5 py-2.5 mx-3 my-2.5 rounded-xl bg-[#0c1017] border border-[#1f283d]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#141a27] text-[#fcee21] border border-[#222c3f]">
              <Building className="w-3.5 h-3.5" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{user.tenantName}</p>
              <p className="text-[10px] text-slate-400 font-mono">Org ID: {user.tenantId}</p>
            </div>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto px-3 py-2">{renderNavLinks()}</nav>

        {/* Customer Portal Preview Link & Health */}
        <div className="p-3 border-t border-[#1f283d] bg-[#08090d] space-y-2">
          <Link
            href="/portal/home"
            className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#111722] hover:bg-[#1a2333] border border-[#242f44] text-xs font-semibold text-slate-200 hover:text-[#fcee21] transition-all group"
          >
            <div className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-[#fcee21]" />
              <span>Customer Portal Preview</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />
          </Link>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-1">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              CORE HEALTH NORMAL
            </span>
            <span className="text-slate-500">v3.0</span>
          </div>
        </div>

        {/* User footer card */}
        <div className="border-t border-[#1f283d] p-3 bg-[#0a0d13]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="h-8 w-8 rounded-full bg-[#161c28] border border-[#27354d] flex items-center justify-center font-bold text-xs text-[#fcee21]">
                {user.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">{user.name}</p>
                <p className="text-[10px] text-slate-400 truncate font-mono">{user.email}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#1f283d] bg-[#07080b]/95 backdrop-blur-md px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-slate-300 hover:bg-[#151b28] hover:text-white"
              aria-label="Open navigation drawer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-400">Brightloop</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <span className="font-bold text-white uppercase tracking-wider font-mono">
                {pathname.split('/')[1] || 'Dashboard'}
              </span>
            </div>

            {/* Quick Command Palette */}
            <CommandPalette />
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* System SLA Badge */}
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0d121c] border border-[#1f283d] text-[11px] font-mono text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-emerald-400 font-bold">SYSTEM SLA 99.98%</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">&lt;180ms Latency</span>
            </div>

            {/* Alert Indicator */}
            {alertsCount > 0 && (
              <Link
                href="/dashboard"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-950/60 border border-amber-800 text-amber-300 text-xs font-semibold hover:bg-amber-950 transition-colors"
                title={`${alertsCount} critical items require attention`}
              >
                <Bell className="w-3.5 h-3.5 text-[#fcee21] animate-bounce" />
                <span className="font-mono font-bold">{alertsCount}</span>
              </Link>
            )}

            <ScenarioSwitcher />
            <RoleSwitcher />
          </div>
        </header>

        {/* Page Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>

      {/* Mobile Drawer */}
      <Drawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        title="Brightloop Navigation"
      >
        <div className="py-2">{renderNavLinks()}</div>
      </Drawer>
    </div>
  );
}
