'use client';

import React, { useState } from 'react';
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
  Shield,
  ChevronRight,
} from 'lucide-react';
import { Drawer } from '@brightloop/ui';
import { RoleSwitcher } from '@/components/domain/RoleSwitcher';
import { ScenarioSwitcher } from '@/components/domain/ScenarioSwitcher';
import { useApp } from '@/lib/context';
import { TenantRole } from '@brightloop/shared-types';

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, role, can } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navSections = [
    {
      title: 'Overview',
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'Customers',
      items: [
        { label: 'Directory', href: '/customers', icon: Users },
      ],
    },
    {
      title: 'Catalog',
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
      title: 'Sales & Lifecycle',
      items: [
        { label: 'Subscriptions', href: '/sales/subscriptions', icon: FileSignature },
        { label: 'Quotations', href: '/sales/quotes', icon: Send },
        { label: 'Templates', href: '/sales/templates', icon: FileSpreadsheet },
      ],
    },
    {
      title: 'Finance & Ledger',
      items: [
        { label: 'Invoices', href: '/finance/invoices', icon: Receipt },
        { label: 'Payments Ledger', href: '/finance/payments', icon: CreditCard },
        { label: 'Financial Reports', href: '/finance/reports', icon: BarChart3 },
      ],
    },
    {
      title: 'Governance',
      items: [
        { label: 'Tenant Settings', href: '/settings', icon: Settings },
        ...(role === TenantRole.TENANT_ADMIN
          ? [{ label: 'Team & Staff', href: '/settings/staff', icon: UserPlus }]
          : []),
      ],
    },
  ];

  const renderNavLinks = () => (
    <div className="space-y-6">
      {navSections.map((section, idx) => (
        <div key={idx} className="space-y-1">
          <span className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 select-none">
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
                  className={`group flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold tracking-tight transition-all select-none ${
                    isActive
                      ? 'bg-[#fcee21] text-black shadow-sm font-bold'
                      : 'text-slate-300 hover:bg-[#151b28] hover:text-white'
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
                          : 'bg-[#1c2436] text-slate-400 border border-[#242f44]'
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
      <aside className="hidden lg:flex w-64 flex-col border-r border-[#242f44] bg-[#08090d] shrink-0 sticky top-0 h-screen">
        {/* Brand Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#242f44]">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fcee21] text-black font-extrabold shadow-sm">
              <Zap className="h-5 w-5 fill-current" />
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-white">
                BRIGHTLOOP
              </span>
              <span className="block text-[9px] font-mono uppercase tracking-widest text-[#fcee21]">
                Recurring Billing
              </span>
            </div>
          </Link>
        </div>

        {/* Tenant Profile Badge */}
        <div className="px-4 py-3 mx-3 my-2 rounded-lg bg-[#0d111a] border border-[#242f44]">
          <div className="flex items-center gap-2">
            <Building className="w-3.5 h-3.5 text-[#fcee21] shrink-0" />
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{user.tenantName}</p>
              <p className="text-[10px] text-slate-400 font-mono">Tenant: {user.tenantId}</p>
            </div>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto px-3 py-2">{renderNavLinks()}</nav>

        {/* User footer */}
        <div className="border-t border-[#242f44] p-3 bg-[#0d111a]/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="h-7 w-7 rounded-full bg-[#151b28] border border-[#242f44] flex items-center justify-center font-bold text-xs text-[#fcee21]">
                {user.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">{user.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#242f44] bg-[#08090d]/95 backdrop-blur-md px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-slate-300 hover:bg-[#151b28] hover:text-white"
              aria-label="Open mobile navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-block text-xs font-semibold text-slate-400">
                Workspace
              </span>
              <ChevronRight className="hidden sm:inline-block w-3.5 h-3.5 text-slate-600" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                {pathname.split('/')[1] || 'Dashboard'}
              </span>
            </div>
          </div>

          {/* Role & Scenario Switcher Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ScenarioSwitcher />
            <RoleSwitcher />
          </div>
        </header>

        {/* Page Content */}
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
