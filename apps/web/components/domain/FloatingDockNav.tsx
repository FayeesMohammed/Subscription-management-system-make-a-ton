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
  Send,
  Receipt,
  BarChart3,
  Globe,
  Settings,
  Layers,
  FileSignature,
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
}

const DEFAULT_WORKSPACE_ITEMS: DockNavItem[] = [
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
    label: 'Subscriptions',
    href: '/sales/subscriptions',
    icon: Calendar,
    matchPrefix: ['/sales/subscriptions', '/sales/templates', '/catalog/plans'],
  },
  {
    id: 'customers',
    label: 'Customers',
    href: '/customers',
    icon: Users,
    matchPrefix: ['/customers'],
  },
  {
    id: 'quotes',
    label: 'Quotations',
    href: '/sales/quotes',
    icon: MessageSquare,
    matchPrefix: ['/sales/quotes'],
  },
  {
    id: 'reports',
    label: 'Finance Reports',
    href: '/finance/reports',
    icon: Mail,
    matchPrefix: ['/finance/reports'],
  },
  {
    id: 'portal',
    label: 'Customer Portal',
    href: '/portal-preview',
    icon: Globe,
    matchPrefix: ['/portal-preview', '/portal'],
  },
];

export const FloatingDockNav: React.FC<FloatingDockNavProps> = ({
  items = DEFAULT_WORKSPACE_ITEMS,
  className = '',
}) => {
  const pathname = usePathname();

  const isItemActive = (item: DockNavItem) => {
    if (pathname === item.href) return true;
    if (item.matchPrefix) {
      return item.matchPrefix.some((prefix) => pathname.startsWith(prefix));
    }
    return false;
  };

  return (
    <nav
      aria-label="Quick Top Dock Navigation"
      className={`inline-flex items-center p-1 sm:p-1.5 rounded-2xl bg-[#0f1420]/95 backdrop-blur-xl border border-[#232d42]/90 shadow-2xl shadow-black/80 gap-1 select-none overflow-x-auto no-scrollbar max-w-full ${className}`}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = isItemActive(item);

        return (
          <div key={item.id} className="relative group shrink-0">
            <Link
              href={item.href}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-200 relative ${
                active
                  ? 'bg-[#fcee21]/15 text-[#fcee21] border border-[#fcee21]/50 shadow-[0_0_12px_rgba(252,238,33,0.22)]'
                  : 'text-slate-400 hover:text-white hover:bg-[#1a2337]'
              }`}
            >
              <Icon
                className={`w-4 h-4 sm:w-[18px] sm:h-[18px] transition-transform duration-200 group-hover:scale-110 ${
                  active ? 'text-[#fcee21] stroke-[2.2]' : 'stroke-[1.8]'
                }`}
              />

              {/* Active Indicator Dot directly underneath */}
              {active && (
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#fcee21] shadow-[0_0_6px_#fcee21]" />
              )}
            </Link>

            {/* Hover Floating Tooltip */}
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-md bg-[#090d15] border border-[#242f44] text-[11px] font-semibold text-slate-200 shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 whitespace-nowrap hidden sm:block">
              <span>{item.label}</span>
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#090d15] border-t border-l border-[#242f44] rotate-45" />
            </div>
          </div>
        );
      })}
    </nav>
  );
};
