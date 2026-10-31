'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, MetricCard } from '@brightloop/ui';
import { SubscriptionDTO, InvoiceDTO } from '@/mocks/types';
import { mockRepo } from '@/mocks/repository';
import { useApp } from '@/lib/context';
import { formatMoney, formatDate } from '@/lib/formatters';
import { SubscriptionStatus } from '@brightloop/shared-types';
import { SubscriptionStatusBadge } from '@/components/domain/SubscriptionStatusBadge';
import { InvoiceStatusBadge } from '@/components/domain/InvoiceStatusBadge';
import { FileSignature, Receipt, Download, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function PortalHomePage() {
  const { refreshKey, scenario } = useApp();
  const [activeSubs, setActiveSubs] = useState<SubscriptionDTO[]>([]);
  const [quotes, setQuotes] = useState<SubscriptionDTO[]>([]);
  const [invoices, setInvoices] = useState<InvoiceDTO[]>([]);
  const [loading, setLoading] = useState(true);

  // Portal customer ID is cust-101
  const customerId = 'cust-101';

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [subs, invs] = await Promise.all([
        mockRepo.getSubscriptions(customerId),
        mockRepo.getInvoices(customerId),
      ]);

      setActiveSubs(subs.filter((s) => s.status === SubscriptionStatus.ACTIVE));
      setQuotes(subs.filter((s) => s.status === SubscriptionStatus.QUOTATION));
      setInvoices(invs);
      setLoading(false);
    }
    load();
  }, [refreshKey, scenario]);

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading your subscription portal...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#242f44] pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Customer Self-Service Hub
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Review active recurring contracts, inspect commercial quotes, and download tax invoices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950/80 border border-emerald-800 text-emerald-300 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Verified Customer Session
          </span>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Active Subscriptions"
          value={String(activeSubs.length)}
          subtext="Current active licenses"
          icon={<FileSignature className="w-4 h-4" />}
          accent
        />
        <MetricCard
          title="Pending Quotations"
          value={String(quotes.length)}
          subtext="Awaiting your acceptance"
          icon={<Receipt className="w-4 h-4" />}
        />
        <MetricCard
          title="Invoices on Record"
          value={String(invoices.length)}
          subtext="Available for download"
          icon={<Download className="w-4 h-4" />}
        />
      </div>

      {/* Active Subscriptions */}
      <Card surface="dark" className="space-y-4 border border-[#242f44]">
        <div className="flex items-center justify-between border-b border-[#242f44] pb-3">
          <div className="flex items-center gap-2">
            <FileSignature className="w-4 h-4 text-[#fcee21]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              My Active Subscriptions
            </h2>
          </div>
          <Link
            href="/portal/subscriptions"
            className="text-xs font-semibold text-[#fcee21] hover:underline flex items-center gap-1"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {activeSubs.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-400">
            You currently have no active recurring subscriptions.
          </p>
        ) : (
          <div className="space-y-2">
            {activeSubs.map((sub) => (
              <div
                key={sub.id}
                className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-[#08090d] border border-[#242f44]"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs font-mono">
                      {sub.subscriptionNumber}
                    </span>
                    <SubscriptionStatusBadge status={sub.status} size="sm" />
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">{sub.planNickname}</p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Renews: {formatDate(sub.currentPeriodEnd)}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-sm font-extrabold font-mono text-[#fcee21]">
                    {formatMoney(sub.totalAmount, sub.currency)}
                  </span>
                  <span className="block text-[10px] text-slate-400 capitalize">
                    /{sub.billingInterval}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Invoices Download Section */}
      <Card surface="dark" className="space-y-4 border border-[#242f44]">
        <div className="flex items-center justify-between border-b border-[#242f44] pb-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-[#fcee21]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Latest Invoices &amp; Receipts
            </h2>
          </div>
          <Link
            href="/portal/invoices"
            className="text-xs font-semibold text-[#fcee21] hover:underline flex items-center gap-1"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {invoices.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-400">No invoices on file.</p>
        ) : (
          <div className="space-y-2">
            {invoices.slice(0, 3).map((inv) => (
              <div
                key={inv.id}
                className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-[#08090d] border border-[#242f44]"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs font-mono">
                      {inv.invoiceNumber}
                    </span>
                    <InvoiceStatusBadge status={inv.status} isOverdue={inv.isOverdue} size="sm" />
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Issue: {formatDate(inv.issueDate)} • Due: {formatDate(inv.dueDate)}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-sm font-extrabold font-mono text-white">
                      {formatMoney(inv.totalAmount, inv.currency)}
                    </span>
                    <span className="block text-[10px] font-mono text-slate-400">
                      Balance: {formatMoney(inv.outstandingBalance, inv.currency)}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Download className="w-3.5 h-3.5" />}
                    onClick={() => window.print()}
                  >
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
