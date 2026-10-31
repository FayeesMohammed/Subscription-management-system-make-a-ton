'use client';

import React, { useState, useEffect } from 'react';
import { Button, Card, MetricCard } from '@brightloop/ui';
import { mockRepo } from '@/mocks/repository';
import { DashboardMetricsDTO, InvoiceDTO } from '@/mocks/types';
import { formatMoney } from '@/lib/formatters';
import { useApp } from '@/lib/context';
import { useToast } from '@/lib/toast';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Calendar,
  ShieldCheck,
  Clock,
  Download,
  FileSpreadsheet,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { ReceivablesIndicator } from '@/components/domain/ReceivablesIndicator';
import { FinancialTrajectoryChart } from '@/components/domain/FinancialTrajectoryChart';

export default function ReportsPage() {
  const { refreshKey } = useApp();
  const { success } = useToast();
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

  const handleExportAuditReport = () => {
    if (!metrics) return;
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        ['Metric', 'Value', 'Currency', 'Audit Period'].join(','),
        ['Normalized MRR', metrics.mrr, 'INR', dateFilter],
        ['Active Subscriptions', String(metrics.activeSubscriptions), 'COUNT', dateFilter],
        ['Collected Revenue', metrics.collectedRevenue, 'INR', dateFilter],
        ['Outstanding Receivables', metrics.outstandingReceivables, 'INR', dateFilter],
        ['Overdue Receivables', metrics.overdueReceivables, 'INR', dateFilter],
        ['Estimated CGST (9%)', ((Number(metrics.collectedRevenue) * 0.09) / 1.18).toFixed(2), 'INR', dateFilter],
        ['Estimated SGST (9%)', ((Number(metrics.collectedRevenue) * 0.09) / 1.18).toFixed(2), 'INR', dateFilter],
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Brightloop_Financial_Report_${dateFilter}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    success('Audit Ledger Downloaded', `Exported fiscal statement for ${dateFilter}.`);
  };

  if (loading || !metrics) {
    return <div className="p-8 text-center text-slate-400">Compiling financial reporting ledger...</div>;
  }

  // Trajectory points dynamically shaped by the dateFilter
  const trajectoryPoints =
    dateFilter === 'Q3_2026'
      ? [
          { month: 'Jul 26', collections: 48000, mrr: 45000 },
          { month: 'Aug 26', collections: 56000, mrr: 52000 },
          { month: 'Sep 26', collections: 64000, mrr: 61000 },
        ]
      : dateFilter === 'FY26'
      ? [
          { month: 'Apr 26', collections: 32000, mrr: 30000 },
          { month: 'Jun 26', collections: 45000, mrr: 42000 },
          { month: 'Aug 26', collections: 58000, mrr: 54000 },
          { month: 'Oct 26', collections: 75000, mrr: 68000 },
          { month: 'Dec 26', collections: 92000, mrr: 84000 },
          { month: 'Feb 27', collections: 110000, mrr: 98000 },
        ]
      : [
          { month: 'Oct 26', collections: 75000, mrr: 68000 },
          { month: 'Nov 26', collections: 84000, mrr: 76000 },
          { month: 'Dec 26 (Proj)', collections: 98000, mrr: 89000 },
        ];

  return (
    <div className="space-y-6">
      {/* Header */}
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

        <div className="flex items-center gap-3">
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

          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={handleExportAuditReport}
          >
            Export Audit CSV
          </Button>
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

      {/* Interactive Financial Trajectory Chart */}
      <FinancialTrajectoryChart
        data={trajectoryPoints}
        title={`MRR Run-Rate vs Invoiced Realization (${dateFilter.replace('_', ' ')})`}
      />

      {/* Receivables Aging breakdown */}
      <ReceivablesIndicator
        collected={metrics.collectedRevenue}
        outstanding={metrics.outstandingReceivables}
        overdue={metrics.overdueReceivables}
      />

      {/* Aging Cohort Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card surface="dark" className="p-3.5 border border-[#242f44]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
            Current / Not Due (0-30 Days)
          </span>
          <p className="text-xl font-extrabold font-mono text-white mt-1">
            {formatMoney(Number(metrics.outstandingReceivables) - Number(metrics.overdueReceivables))}
          </p>
          <span className="text-[11px] text-slate-400">Within payment terms</span>
        </Card>

        <Card surface="dark" className="p-3.5 border border-[#242f44]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
            Aging Overdue (31-60 Days)
          </span>
          <p className="text-xl font-extrabold font-mono text-amber-400 mt-1">
            {formatMoney(Number(metrics.overdueReceivables) * 0.7)}
          </p>
          <span className="text-[11px] text-slate-400">Follow-up reminders issued</span>
        </Card>

        <Card surface="dark" className="p-3.5 border border-[#242f44]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
            Delinquent (&gt;60 Days)
          </span>
          <p className="text-xl font-extrabold font-mono text-rose-400 mt-1">
            {formatMoney(Number(metrics.overdueReceivables) * 0.3)}
          </p>
          <span className="text-[11px] text-slate-400">Requires executive escalation</span>
        </Card>
      </div>

      {/* Tax & GST Compliance Summary */}
      <Card surface="dark" className="space-y-4 border border-[#242f44]">
        <div className="flex items-center justify-between border-b border-[#242f44] pb-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#fcee21]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              GST &amp; Tax Liability Breakdown (18% Standard Tier)
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">Jurisdiction: India (GSTIN)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-lg bg-[#08090d] border border-[#242f44] space-y-1">
            <span className="text-slate-400">CGST (9%) Collected:</span>
            <p className="text-base font-bold font-mono text-white">
              {formatMoney((Number(metrics.collectedRevenue) * 0.09) / 1.18)}
            </p>
            <span className="text-[10px] text-slate-500">Central Goods &amp; Services Tax</span>
          </div>
          <div className="p-3 rounded-lg bg-[#08090d] border border-[#242f44] space-y-1">
            <span className="text-slate-400">SGST (9%) Collected:</span>
            <p className="text-base font-bold font-mono text-white">
              {formatMoney((Number(metrics.collectedRevenue) * 0.09) / 1.18)}
            </p>
            <span className="text-[10px] text-slate-500">State Goods &amp; Services Tax</span>
          </div>
          <div className="p-3 rounded-lg bg-[#08090d] border border-[#242f44] space-y-1">
            <span className="text-slate-400">Total Statutory Tax Retained:</span>
            <p className="text-base font-bold font-mono text-[#fcee21]">
              {formatMoney((Number(metrics.collectedRevenue) * 0.18) / 1.18)}
            </p>
            <span className="text-[10px] text-slate-500">Scheduled for monthly GSTR-3B filing</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
