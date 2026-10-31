'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileSignature, Receipt, Users, Package, ArrowRight, X } from 'lucide-react';
import { mockRepo } from '@/mocks/repository';
import { CustomerDTO, SubscriptionDTO, InvoiceDTO } from '@/mocks/types';

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [customers, setCustomers] = useState<CustomerDTO[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionDTO[]>([]);
  const [invoices, setInvoices] = useState<InvoiceDTO[]>([]);
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      Promise.all([
        mockRepo.getCustomers(),
        mockRepo.getSubscriptions(),
        mockRepo.getInvoices(),
      ]).then(([c, s, i]) => {
        setCustomers(c);
        setSubscriptions(s);
        setInvoices(i);
      });
    }
  }, [isOpen]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0e121a] hover:bg-[#161c28] border border-[#242f44] text-xs text-slate-400 hover:text-white transition-all shadow-sm"
        aria-label="Open search command palette"
      >
        <Search className="w-3.5 h-3.5" />
        <span>Quick search...</span>
        <kbd className="ml-2 font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#151b28] border border-[#242f44] text-slate-300">
          ⌘K
        </kbd>
      </button>
    );
  }

  const q = query.toLowerCase().trim();

  const filteredCustomers = customers.filter(
    (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q),
  ).slice(0, 3);

  const filteredSubs = subscriptions.filter(
    (s) => s.subscriptionNumber.toLowerCase().includes(q) || s.customerName.toLowerCase().includes(q),
  ).slice(0, 3);

  const filteredInvoices = invoices.filter(
    (i) => i.invoiceNumber.toLowerCase().includes(q) || i.customerName.toLowerCase().includes(q),
  ).slice(0, 3);

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    setQuery('');
    router.push(path);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-xl rounded-2xl border border-[#242f44] bg-[#0c1017] p-4 shadow-2xl z-10 text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3 pb-3 border-b border-[#1b2333]">
          <Search className="w-5 h-5 text-[#fcee21]" />
          <input
            type="text"
            autoFocus
            placeholder="Jump to Customer, Subscription, Invoice, or Catalog..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-3 max-h-96 overflow-y-auto space-y-4 text-xs">
          {/* Quick Pages */}
          {!q && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2">
                Quick Navigation
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { label: 'Dashboard Overview', path: '/dashboard' },
                  { label: 'Create Quotation', path: '/sales/quotes' },
                  { label: 'Invoices & Receivables', path: '/finance/invoices' },
                  { label: 'Manual Payments Ledger', path: '/finance/payments' },
                  { label: 'Product Catalog', path: '/catalog/products' },
                  { label: 'Billing Plans & Rules', path: '/catalog/plans' },
                ].map((item) => (
                  <button
                    key={item.path}
                    onClick={() => handleNavigate(item.path)}
                    className="flex items-center justify-between p-2 rounded-lg bg-[#121620] hover:bg-[#1a2030] text-slate-200 text-left transition-colors"
                  >
                    <span>{item.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Subscriptions */}
          {filteredSubs.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 flex items-center gap-1.5">
                <FileSignature className="w-3.5 h-3.5 text-[#fcee21]" /> Subscriptions &amp; Quotes
              </span>
              {filteredSubs.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleNavigate(`/sales/subscriptions/${s.id}`)}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#151c2a] text-left transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white">{s.subscriptionNumber}</span>
                    <span className="text-slate-400">• {s.customerName}</span>
                  </div>
                  <span className="font-mono font-bold text-[#fcee21] uppercase text-[10px]">
                    {s.status}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Invoices */}
          {filteredInvoices.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-sky-400" /> Invoices
              </span>
              {filteredInvoices.map((i) => (
                <button
                  key={i.id}
                  onClick={() => handleNavigate(`/finance/invoices/${i.id}`)}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#151c2a] text-left transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white">{i.invoiceNumber}</span>
                    <span className="text-slate-400">• {i.customerName}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-300">
                    Bal: ₹{i.outstandingBalance}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Customers */}
          {filteredCustomers.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-400" /> Customers
              </span>
              {filteredCustomers.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleNavigate(`/customers/${c.id}`)}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#151c2a] text-left transition-colors"
                >
                  <div>
                    <span className="font-bold text-white">{c.name}</span>
                    <span className="text-slate-400 block text-[11px]">{c.email}</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-[#1b2333] flex items-center justify-between text-[11px] text-slate-500">
          <span>Press ESC or click outside to dismiss</span>
          <span>Navigation Ready</span>
        </div>
      </div>
    </div>
  );
};
