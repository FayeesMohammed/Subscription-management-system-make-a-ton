'use client';

import React, { useState, useEffect } from 'react';
import { Button, Input, Table, Card } from '@brightloop/ui';
import { InvoiceDTO } from '@/mocks/types';
import { mockRepo } from '@/mocks/repository';
import { useApp } from '@/lib/context';
import { formatMoney, formatDate } from '@/lib/formatters';
import { InvoiceStatus } from '@brightloop/shared-types';
import { InvoiceStatusBadge } from '@/components/domain/InvoiceStatusBadge';
import { MoneyDisplay } from '@/components/domain/MoneyDisplay';
import { Receipt, Search, Download, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function InvoicesPage() {
  const { refreshKey } = useApp();
  const [invoices, setInvoices] = useState<InvoiceDTO[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await mockRepo.getInvoices();
      setInvoices(data);
      setLoading(false);
    }
    load();
  }, [refreshKey]);

  const filtered = invoices.filter((i) => {
    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'OVERDUE'
        ? i.isOverdue
        : i.status.toLowerCase() === statusFilter.toLowerCase();

    const matchesSearch =
      i.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      i.customerName.toLowerCase().includes(search.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#242f44] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              Invoices &amp; Receivables
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-[#151b28] border border-[#242f44] text-slate-300">
              {invoices.length} Invoices
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Lifecycle: DRAFT → CONFIRMED → PAID / VOID. Confirmed invoices produce an immutable financial snapshot.
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="max-w-xs w-full">
          <Input
            placeholder="Search by Invoice # or Customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftAddon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-semibold mr-1">Filter:</span>
          {(['ALL', 'draft', 'confirmed', 'paid', 'void', 'OVERDUE'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-bold uppercase transition-all whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-[#fcee21] text-black shadow-sm'
                  : 'bg-[#0d111a] text-slate-400 hover:text-white border border-[#242f44]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <Table<InvoiceDTO>
        columns={[
          {
            header: 'Invoice #',
            cell: (i) => (
              <div className="space-y-0.5">
                <Link
                  href={`/finance/invoices/${i.id}`}
                  className="font-bold text-white hover:text-[#fcee21] font-mono text-xs flex items-center gap-1.5"
                >
                  <Receipt className="w-3.5 h-3.5 text-[#fcee21]" />
                  <span>{i.invoiceNumber}</span>
                </Link>
                <p className="text-[11px] text-slate-400">{i.customerName}</p>
              </div>
            ),
          },
          {
            header: 'Document Status',
            cell: (i) => <InvoiceStatusBadge status={i.status} isOverdue={i.isOverdue} size="sm" />,
          },
          {
            header: 'Issue / Due Date',
            cell: (i) => (
              <div className="space-y-0.5 font-mono text-xs">
                <p className="text-slate-200">Issued: {formatDate(i.issueDate)}</p>
                <p className={i.isOverdue ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                  Due: {formatDate(i.dueDate)}
                </p>
              </div>
            ),
          },
          {
            header: 'Total Value',
            align: 'right',
            cell: (i) => (
              <MoneyDisplay amount={i.totalAmount} currency={i.currency} size="sm" />
            ),
          },
          {
            header: 'Settled (Paid)',
            align: 'right',
            cell: (i) => (
              <MoneyDisplay
                amount={i.paidAmount}
                currency={i.currency}
                size="sm"
                color={Number(i.paidAmount) > 0 ? 'success' : 'muted'}
              />
            ),
          },
          {
            header: 'Balance Due',
            align: 'right',
            cell: (i) => (
              <MoneyDisplay
                amount={i.outstandingBalance}
                currency={i.currency}
                size="sm"
                color={Number(i.outstandingBalance) > 0 ? 'yellow' : 'muted'}
              />
            ),
          },
          {
            header: 'Action',
            align: 'right',
            cell: (i) => (
              <Link href={`/finance/invoices/${i.id}`}>
                <Button variant="outline" size="sm">
                  Inspect &amp; Pay
                </Button>
              </Link>
            ),
          },
        ]}
        data={filtered}
        keyExtractor={(i) => i.id}
        isLoading={loading}
        emptyMessage="No invoices match the selected criteria."
      />
    </div>
  );
}
