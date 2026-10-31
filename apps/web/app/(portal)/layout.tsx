'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  FileSignature,
  Send,
  Receipt,
  User,
  Zap,
  Menu,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { Drawer } from '@brightloop/ui';
import { RoleSwitcher } from '@/components/domain/RoleSwitcher';
import { ScenarioSwitcher } from '@/components/domain/ScenarioSwitcher';
import { useApp } from '@/lib/context';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Home', href: '/portal/home', icon: Home },
    { label: 'My Subscriptions', href: '/portal/subscriptions', icon: FileSignature },
    { label: 'My Quotes', href: '/portal/quotes', icon: Send },
    { label: 'My Invoices', href: '/portal/invoices', icon: Receipt },
    { label: 'Profile', href: '/portal/profile', icon: User },
  ];

  const renderNavLinks = (isMobile = false) => (
    <div className={`flex ${isMobile ? 'flex-col space-y-1' : 'items-center gap-1'}`}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === '/portal/home'
            ? pathname === '/portal/home'
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold tracking-tight transition-all select-none ${
              isActive
                ? 'bg-[#fcee21] text-black font-bold shadow-sm'
                : 'text-slate-300 hover:bg-[#151b28] hover:text-white'
            }`}
          >
            <Icon
              className={`h-4 w-4 shrink-0 ${
                isActive ? 'text-black' : 'text-slate-400'
              }`}
            />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#08090d] text-slate-100">
      {/* Portal Topbar */}
      <header className="sticky top-0 z-30 border-b border-[#242f44] bg-[#08090d]/95 backdrop-blur-md px-4 py-3 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-1.5 rounded-lg text-slate-300 hover:bg-[#151b28] hover:text-white"
              aria-label="Open portal navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link href="/portal/home" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#fcee21] text-black font-extrabold">
                <Zap className="h-4 w-4 fill-current" />
              </div>
              <div>
                <span className="text-sm font-extrabold tracking-tight text-white">
                  BRIGHTLOOP
                </span>
                <span className="ml-1.5 px-1.5 py-0.2 rounded bg-emerald-950/80 border border-emerald-800 text-[10px] font-bold text-emerald-300 uppercase">
                  Customer Portal
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center">{renderNavLinks(false)}</nav>

          {/* Role & Scenario Switcher Bar */}
          <div className="flex items-center gap-2">
            <ScenarioSwitcher />
            <RoleSwitcher />
          </div>
        </div>
      </header>

      {/* Customer Header Banner */}
      <div className="border-b border-[#242f44] bg-[#0d111a]/80 py-3 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-[#fcee21]" />
            <span className="text-slate-400">Account:</span>
            <span className="font-bold text-white">{user.name}</span>
            <span className="text-slate-500 font-mono text-[11px]">({user.email})</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Secure Self-Service Mode (Read-Only)</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8">{children}</main>

      {/* Mobile Drawer */}
      <Drawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        title="Customer Portal Menu"
      >
        <div className="py-2">{renderNavLinks(true)}</div>
      </Drawer>
    </div>
  );
}
