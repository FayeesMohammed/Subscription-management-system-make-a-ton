'use client';

import React, { useState, useEffect } from 'react';
import { Button, Card, MetricCard } from '@brightloop/ui';
import { mockRepo } from '@/mocks/repository';
import { DashboardMetricsDTO, InvoiceDTO } from '@/mocks/types';
import { formatMoney } from '@/lib/formatters';
import { useApp } from '@/lib/context';
import { BarChart3, TrendingUp, DollarSign, Calendar, ShieldCheck, Clock } from 'lucide-react';
import { ReceivablesIndicator } from '@/components/domain/ReceivablesIndicator';

export default function ReportsPage() {
  const { refreshKey } = useApp();
  const [metrics, setMetrics] = useState<DashboardMetricsDTO | null>(null);
  const [invoices, setInvoices] = useState<InvoiceDTO[]>([]);
  const [dateFilter, setDateFilter] = useState<'Q3_2026' | 'Q4_2026' | 'FY26'>('Q4_2026');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [m, invs] = await Promise.all([
        mockRepo.getDashboardMetrics(),
        mockRepo.getInvoices(),
      ]);
      setMetrics(m);
      setInvoices(invs);
      setLoading(false);
    }
    load();
  }, [refreshKey]);

  if (loading || !metrics) {
    return <div className="p-8 text-center text-slate-400">Compiling financial reporting ledger...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#242f44] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              Financial Reporting &amp; Receivables Aging
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#fcee21]/15 text-[#fcee21] border border-[#fcee21]/40">
              Sub-2s SLA Compliant
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Reconciliation drill-down, revenue collection efficiency, and receivables aging.
          </p>
        </div>

        {/* Date Filter */}
        <div className="flex items-center rounded-lg border border-[#242f44] bg-[#0d111a] p-1 text-xs">
          {(['Q3_2026', 'Q4_2026', 'FY26'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setDateFilter(period)}
              className={`px-3 py-1 rounded font-bold uppercase transition-colors ${
                dateFilter === period
                  ? 'bg-[#fcee21] text-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {period.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Normalized MRR Run-Rate"
          value={formatMoney(metrics.mrr)}
          subtext="Annualized active recurring contracts"
          icon={<TrendingUp className="w-4 h-4" />}
          accent
        />
        <MetricCard
          title="Total Invoiced Gross"
          value={formatMoney(
            Number(metrics.collectedRevenue) + Number(metrics.outstandingReceivables),
          )}
          subtext="Total commercial billings"
          icon={<DollarSign className="w-4 h-4" />}
        />
        <MetricCard
          title="Cash Collection Efficiency"
          value={`${(
            (Number(metrics.collectedRevenue) /
              (Number(metrics.collectedRevenue) + Number(metrics.outstandingReceivables) || 1)) *
            100
          ).toFixed(1)}%`}
          subtext="Realized vs billed"
          icon={<ShieldCheck className="w-4 h-4" />}
        />
      </div>

      {/* Receivables Aging breakdown */}
      <ReceivablesIndicator
        collected={metrics.collectedRevenue}
        outstanding={metrics.outstandingReceivables}
        overdue={metrics.overdueReceivables}
      />

      {/* Tax & GST Compliance Summary */}
      <Card surface="dark" className="space-y-4 border border-[#242f44]">
        <div className="flex items-center justify-between border-b border-[#242f44] pb-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            GST &amp; Tax Liability Breakdown (18% Standard Tier)
          </h2>
          <span className="text-xs font-mono text-slate-400">Jurisdiction: India (GSTIN)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-lg bg-[#08090d] border border-[#242f44] space-y-1">
            <span className="text-slate-400">CGST (9%) Collected:</span>
            <p className="text-base font-bold font-mono text-white">
              {formatMoney((Number(metrics.collectedRevenue) * 0.09) / 1.18)}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-[#08090d] border border-[#242f44] space-y-1">
            <span className="text-slate-400">SGST (9%) Collected:</span>
            <p className="text-base font-bold font-mono text-white">
              {formatMoney((Number(metrics.collectedRevenue) * 0.09) / 1.18)}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-[#08090d] border border-[#242f44] space-y-1">
            <span className="text-slate-400">Net Tax Retained:</span>
            <p className="text-base font-bold font-mono text-[#fcee21]">
              {formatMoney((Number(metrics.collectedRevenue) * 0.18) / 1.18)}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
