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
  Bell,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Drawer } from '@brightloop/ui';
import { RoleSwitcher } from '@/components/domain/RoleSwitcher';
import { ScenarioSwitcher } from '@/components/domain/ScenarioSwitcher';
import { CommandPalette } from '@/components/domain/CommandPalette';
import { useApp } from '@/lib/context';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Overview', href: '/portal/home', icon: Home },
    { label: 'Active Subscriptions', href: '/portal/subscriptions', icon: FileSignature },
    { label: 'Pending Quotes', href: '/portal/quotes', icon: Send },
    { label: 'Invoices & Receipts', href: '/portal/invoices', icon: Receipt },
    { label: 'Company Profile', href: '/portal/profile', icon: User },
  ];

  const renderNavLinks = (isMobile = false) => (
    <div className={`flex ${isMobile ? 'flex-col space-y-1' : 'items-center gap-1.5'}`}>
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
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold tracking-tight transition-all select-none ${
              isActive
                ? 'bg-[#fcee21] text-black font-bold shadow-sm'
                : 'text-slate-300 hover:bg-[#151b28] hover:text-white'
            }`}
          >
            <Icon
              className={`h-3.5 w-3.5 shrink-0 ${
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
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-[#242f44] bg-[#07080b]/95 backdrop-blur-md px-4 py-2.5 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-1.5 rounded-lg text-slate-300 hover:bg-[#151b28] hover:text-white"
              aria-label="Open portal navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Brand Logo */}
            <Link href="/portal/home" className="flex items-center gap-2.5 group">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#fcee21] text-black font-black">
                <Zap className="h-4 w-4 fill-current" />
              </div>
              <div className="hidden sm:block leading-none">
                <span className="text-sm font-black tracking-tight text-white block">
                  BRIGHTLOOP
                </span>
                <span className="text-[9px] font-mono uppercase tracking-widest text-[#fcee21] font-bold">
                  RECURRING BILLING OS
                </span>
              </div>
            </Link>

            {/* Breadcrumb / Section */}
            <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-[#242f44] text-xs">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#141b27] border border-[#242f44] text-slate-300 flex items-center gap-1.5">
                <Building className="w-3 h-3 text-[#fcee21]" />
                Acme Enterprise Global
              </span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center">{renderNavLinks(false)}</nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* System SLA Badge */}
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0d121c] border border-[#1f283d] text-[11px] font-mono text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-emerald-400 font-bold">SYSTEM SLA 99.98%</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">&lt;180ms Latency</span>
            </div>

            {/* Command Palette */}
            <CommandPalette />

            {/* Role & Scenario Switcher */}
            <ScenarioSwitcher />
            <RoleSwitcher />

            {/* Notification Bell */}
            <button
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#151b28] relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#fcee21]" />
            </button>

            {/* User Avatar */}
            <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 border border-[#27354d] flex items-center justify-center font-bold text-xs text-black shrink-0">
              E
            </div>
          </div>
        </div>
      </header>

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>

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
