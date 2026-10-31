'use client';

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  FileSignature,
  AlertTriangle,
  PlusCircle,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Send,
  Zap,
  Users,
  CreditCard,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Button, Card, MetricCard, Alert } from '@brightloop/ui';
import { mockRepo } from '@/mocks/repository';
import { DashboardMetricsDTO, SubscriptionDTO, InvoiceDTO } from '@/mocks/types';
import { formatMoney, formatDate } from '@/lib/formatters';
import { SubscriptionStatusBadge } from '@/components/domain/SubscriptionStatusBadge';
import { InvoiceStatusBadge } from '@/components/domain/InvoiceStatusBadge';
import { ReceivablesIndicator } from '@/components/domain/ReceivablesIndicator';
import { FinancialTrajectoryChart } from '@/components/domain/FinancialTrajectoryChart';
import { useApp } from '@/lib/context';
import Link from 'next/link';

export default function DashboardPage() {
  const { refreshKey, role, scenario } = useApp();
  const [metrics, setMetrics] = useState<DashboardMetricsDTO | null>(null);
  const [recentSubscriptions, setRecentSubscriptions] = useState<SubscriptionDTO[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<InvoiceDTO[]>([]);
  const [dateRange, setDateRange] = useState<'30d' | '90d' | 'ytd'>('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const m = await mockRepo.getDashboardMetrics();
      const subs = await mockRepo.getSubscriptions();
      const invs = await mockRepo.getInvoices();
      setMetrics(m);
      setRecentSubscriptions(subs.slice(0, 4));
      setRecentInvoices(invs.slice(0, 4));
      setLoading(false);
    }
    loadData();
  }, [refreshKey, scenario]);

  if (loading || !metrics) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-[#151b28] rounded-lg" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-[#0d111a] rounded-xl border border-[#242f44]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1f283d] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-white">
              Operations &amp; Finance Command
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#fcee21]/15 text-[#fcee21] border border-[#fcee21]/40 shadow-[0_0_8px_rgba(252,238,33,0.15)]">
              Sub-2s SLA Compliant
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Real-time multi-tenant recurring billing and contract realization metrics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date Filter Pills */}
          <div className="flex items-center rounded-xl border border-[#1f283d] bg-[#0c1017] p-1 text-xs">
            {(['30d', '90d', 'ytd'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1 rounded-lg font-bold uppercase transition-all ${
                  dateRange === range
                    ? 'bg-[#fcee21] text-black shadow-sm font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <Link href="/sales/quotes">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
            >
              Draft Quotation
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Action Navigation Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Issue Quotation', href: '/sales/quotes', icon: Send, color: 'text-[#fcee21]' },
          { label: 'Record Manual Receipt', href: '/finance/payments', icon: CreditCard, color: 'text-emerald-400' },
          { label: 'Add Customer Account', href: '/customers', icon: Users, color: 'text-sky-400' },
          { label: 'Configure Catalog Plan', href: '/catalog/plans', icon: Layers, color: 'text-amber-400' },
        ].map((action, i) => {
          const Icon = action.icon;
          return (
            <Link
              key={i}
              href={action.href}
              className="group flex items-center justify-between p-3 rounded-xl bg-[#0c1017] hover:bg-[#151c2a] border border-[#1f283d] hover:border-[#2a3650] transition-all shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-lg bg-[#141a27] ${action.color} border border-[#222c3f]`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-200 group-hover:text-white">
                  {action.label}
                </span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-1 group-hover:text-[#fcee21] transition-all" />
            </Link>
          );
        })}
      </div>

      {/* Scenario Highlights Alert */}
      {scenario === 'OVERDUE_INVOICE' && (
        <Alert
          variant="error"
          title="Critical Collection Notice: Overdue Receivables Active"
          action={
            <Link href="/finance/invoices">
              <Button variant="danger" size="sm">
                Inspect Invoices
              </Button>
            </Link>
          }
        >
          Confirmed invoice INV-2026-003 for Stellar Media Works is 15 days past its due date.
        </Alert>
      )}

      {scenario === 'QUOTE_NEAR_EXPIRY' && (
        <Alert
          variant="warning"
          title="Quotation Validity Urgency: Expiry in &lt; 2 Hours"
          action={
            <Link href="/sales/quotes">
              <Button variant="secondary" size="sm">
                Review Quotation
              </Button>
            </Link>
          }
        >
          Commercial proposal for Apex Retail Solutions Ltd (₹1,77,000.00) requires urgent customer acceptance.
        </Alert>
      )}

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Monthly Recurring Revenue"
          value={formatMoney(metrics.mrr)}
          change="+14.2%"
          changeType="positive"
          subtext="normalized run-rate"
          icon={<TrendingUp className="w-4 h-4" />}
          accent
        />
        <MetricCard
          title="Total Collected Revenue"
          value={formatMoney(metrics.collectedRevenue)}
          change="+₹13,440"
          changeType="positive"
          subtext="settled payments"
          icon={<DollarSign className="w-4 h-4" />}
        />
        <MetricCard
          title="Outstanding Receivables"
          value={formatMoney(metrics.outstandingReceivables)}
          change="Pending due"
          changeType="neutral"
          subtext="issued invoices"
          icon={<Receipt className="w-4 h-4" />}
        />
        <MetricCard
          title="Overdue Receivables"
          value={formatMoney(metrics.overdueReceivables)}
          change={Number(metrics.overdueReceivables) > 0 ? 'Action required' : 'Clear'}
          changeType={Number(metrics.overdueReceivables) > 0 ? 'negative' : 'positive'}
          subtext="past due date"
          icon={<AlertTriangle className="w-4 h-4" />}
        />
      </div>

      {/* Financial Trajectory Chart */}
      <FinancialTrajectoryChart />

      {/* Receivables Realization Progress */}
      <ReceivablesIndicator
        collected={metrics.collectedRevenue}
        outstanding={metrics.outstandingReceivables}
        overdue={metrics.overdueReceivables}
      />

      {/* Subscription Commercial Lifecycle Counts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card surface="dark" className="p-4 border border-[#1f283d] bg-[#0c1017]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Active Subscriptions
          </span>
          <p className="mt-1 text-2xl font-black font-mono text-emerald-400">
            {metrics.activeSubscriptions}
          </p>
        </Card>
        <Card surface="dark" className="p-4 border border-[#1f283d] bg-[#0c1017]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Open Quotations
          </span>
          <p className="mt-1 text-2xl font-black font-mono text-sky-400">
            {metrics.draftQuotations}
          </p>
        </Card>
        <Card surface="dark" className="p-4 border border-[#1f283d] bg-[#0c1017]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Confirmed Pending Start
          </span>
          <p className="mt-1 text-2xl font-black font-mono text-amber-400">
            {metrics.confirmedSubscriptions}
          </p>
        </Card>
        <Card surface="dark" className="p-4 border border-[#1f283d] bg-[#0c1017]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Closed / Completed
          </span>
          <p className="mt-1 text-2xl font-black font-mono text-slate-400">
            {metrics.closedSubscriptions}
          </p>
        </Card>
      </div>

      {/* Operational Grids: Subscriptions & Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Subscriptions */}
        <Card surface="dark" className="space-y-4 border border-[#1f283d] bg-[#0c1017]">
          <div className="flex items-center justify-between border-b border-[#1b2333] pb-3">
            <div className="flex items-center gap-2">
              <FileSignature className="w-4 h-4 text-[#fcee21]" />
              <h2 className="text-sm font-bold tracking-tight text-white uppercase">
                Subscriptions &amp; Quotes Pipeline
              </h2>
            </div>
            <Link
              href="/sales/subscriptions"
              className="text-xs font-semibold text-[#fcee21] hover:underline flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2">
            {recentSubscriptions.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">No subscriptions created yet.</p>
            ) : (
              recentSubscriptions.map((sub) => (
                <Link
                  key={sub.id}
                  href={`/sales/subscriptions/${sub.id}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#121622] hover:bg-[#182030] border border-[#1f283d] transition-all group"
                >
                  <div className="overflow-hidden space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white group-hover:text-[#fcee21]">
                        {sub.subscriptionNumber}
                      </span>
                      <SubscriptionStatusBadge status={sub.status} size="sm" />
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">{sub.customerName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold font-mono text-white">
                      {formatMoney(sub.totalAmount, sub.currency)}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono capitalize">
                      /{sub.billingInterval}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>

        {/* Recent Invoices */}
        <Card surface="dark" className="space-y-4 border border-[#1f283d] bg-[#0c1017]">
          <div className="flex items-center justify-between border-b border-[#1b2333] pb-3">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#fcee21]" />
              <h2 className="text-sm font-bold tracking-tight text-white uppercase">
                Recent Invoices &amp; Receivables
              </h2>
            </div>
            <Link
              href="/finance/invoices"
              className="text-xs font-semibold text-[#fcee21] hover:underline flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2">
            {recentInvoices.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">No invoices issued yet.</p>
            ) : (
              recentInvoices.map((inv) => (
                <Link
                  key={inv.id}
                  href={`/finance/invoices/${inv.id}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#121622] hover:bg-[#182030] border border-[#1f283d] transition-all group"
                >
                  <div className="overflow-hidden space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white group-hover:text-[#fcee21]">
                        {inv.invoiceNumber}
                      </span>
                      <InvoiceStatusBadge
                        status={inv.status}
                        isOverdue={inv.isOverdue}
                        size="sm"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">{inv.customerName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold font-mono text-white">
                      {formatMoney(inv.totalAmount, inv.currency)}
                    </p>
                    <p className="text-[10px] font-mono text-slate-400">
                      Due: {formatDate(inv.dueDate)}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
