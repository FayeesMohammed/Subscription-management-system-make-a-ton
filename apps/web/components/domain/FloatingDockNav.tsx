'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Clock,
  Calendar,
  Users,
  MessageSquare,
  Mail,
} from 'lucide-react';

export interface DockNavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  matchPrefix?: string[];
}

interface FloatingDockNavProps {
  items?: DockNavItem[];
  className?: string;
  accent?: 'coral' | 'yellow';
}

export const DEFAULT_WORKSPACE_ITEMS: DockNavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    matchPrefix: ['/dashboard'],
  },
  {
    id: 'invoices',
    label: 'Invoices & Billing',
    href: '/finance/invoices',
    icon: Clock,
    matchPrefix: ['/finance/invoices', '/finance/payments'],
  },
  {
    id: 'subscriptions',
    label: 'Subscriptions & Catalog',
    href: '/sales/subscriptions',
    icon: Calendar,
    matchPrefix: ['/sales/subscriptions', '/sales/templates', '/catalog'],
  },
  {
    id: 'customers',
    label: 'Customer Directory',
    href: '/customers',
    icon: Users,
    matchPrefix: ['/customers'],
  },
  {
    id: 'quotes',
    label: 'Quotations & Deals',
    href: '/sales/quotes',
    icon: MessageSquare,
    matchPrefix: ['/sales/quotes'],
  },
  {
    id: 'reports',
    label: 'Finance Reports & Ledger',
    href: '/finance/reports',
    icon: Mail,
    matchPrefix: ['/finance/reports'],
  },
];

export const FloatingDockNav: React.FC<FloatingDockNavProps> = ({
  items = DEFAULT_WORKSPACE_ITEMS,
  className = '',
  accent = 'coral',
}) => {
  const pathname = usePathname();

  const isItemActive = (item: DockNavItem) => {
    if (pathname === item.href) return true;
    if (pathname === '/' && item.id === 'dashboard') return true;
    if (item.matchPrefix) {
      return item.matchPrefix.some((prefix) => pathname.startsWith(prefix));
    }
    return false;
  };

  const isCoral = accent === 'coral';

  return (
    <nav
      aria-label="Quick Top Dock Navigation"
      className={`inline-flex items-center p-1 sm:p-1.5 rounded-full bg-[#18181b]/95 backdrop-blur-xl border border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.65)] gap-1 sm:gap-1.5 select-none overflow-x-auto no-scrollbar max-w-full ${className}`}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = isItemActive(item);

        return (
          <div key={item.id} className="relative group shrink-0">
            <Link
              href={item.href}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center transition-all duration-200 relative ${
                active
                  ? isCoral
                    ? 'bg-[#ef4444]/15 text-[#f87171] border border-[#ef4444]/60 shadow-[0_0_14px_rgba(239,68,68,0.25)]'
                    : 'bg-[#fcee21]/15 text-[#fcee21] border border-[#fcee21]/50 shadow-[0_0_12px_rgba(252,238,33,0.22)]'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.08] border border-transparent'
              }`}
            >
              <Icon
                className={`w-[18px] h-[18px] transition-transform duration-200 group-hover:scale-110 ${
                  active
                    ? isCoral
                      ? 'text-[#f87171] stroke-[2.2]'
                      : 'text-[#fcee21] stroke-[2.2]'
                    : 'stroke-[1.8]'
                }`}
              />

              {/* Active Indicator Dot directly underneath */}
              {active && (
                <span
                  className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                    isCoral
                      ? 'bg-[#ef4444] shadow-[0_0_8px_#ef4444]'
                      : 'bg-[#fcee21] shadow-[0_0_6px_#fcee21]'
                  }`}
                />
              )}
            </Link>

            {/* Hover Floating Tooltip */}
            <div className="absolute top-full mt-2.5 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-md bg-[#121316] border border-white/10 text-[11px] font-semibold text-zinc-200 shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 whitespace-nowrap hidden sm:block">
              <span>{item.label}</span>
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#121316] border-t border-l border-white/10 rotate-45" />
            </div>
          </div>
        );
      })}
    </nav>
  );
};
