'use client';

import React, { useState, useEffect } from 'react';
import { Card, Table, Button } from '@brightloop/ui';
import { InvoiceDTO } from '@/mocks/types';
import { mockRepo } from '@/mocks/repository';
import { useApp } from '@/lib/context';
import { formatMoney, formatDate } from '@/lib/formatters';
import { InvoiceStatusBadge } from '@/components/domain/InvoiceStatusBadge';
import { Receipt, Download, ShieldCheck } from 'lucide-react';

export default function PortalInvoicesPage() {
  const { refreshKey, scenario } = useApp();
  const [invoices, setInvoices] = useState<InvoiceDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const customerId = 'cust-101';

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await mockRepo.getInvoices(customerId);
      setInvoices(data);
      setLoading(false);
    }
    load();
  }, [refreshKey, scenario]);

  const handleDownload = (invNum: string) => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#242f44] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              My Tax Invoices
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-[#151b28] border border-[#242f44] text-[#fcee21]">
              {invoices.length} Documents
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Download permanent fiscal records, check payment receipt history, and outstanding dues.
          </p>
        </div>
      </div>

      <Table<InvoiceDTO>
        columns={[
          {
            header: 'Tax Invoice #',
            cell: (i) => (
              <span className="font-mono font-bold text-white text-xs">
                {i.invoiceNumber}
              </span>
            ),
          },
          {
            header: 'Fiscal Status',
            cell: (i) => (
              <InvoiceStatusBadge status={i.status} isOverdue={i.isOverdue} size="sm" />
            ),
          },
          {
            header: 'Issue / Due Date',
            cell: (i) => (
              <div className="font-mono text-xs">
                <p className="text-slate-300">Issued: {formatDate(i.issueDate)}</p>
                <p className={i.isOverdue ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                  Due: {formatDate(i.dueDate)}
                </p>
              </div>
            ),
          },
          {
            header: 'Total Invoiced',
            align: 'right',
            cell: (i) => (
              <span className="font-mono font-bold text-white text-xs">
                {formatMoney(i.totalAmount, i.currency)}
              </span>
            ),
          },
          {
            header: 'Settled',
            align: 'right',
            cell: (i) => (
              <span className="font-mono text-xs text-emerald-400">
                {formatMoney(i.paidAmount, i.currency)}
              </span>
            ),
          },
          {
            header: 'Balance Due',
            align: 'right',
            cell: (i) => (
              <span className="font-mono font-bold text-xs text-yellow-300">
                {formatMoney(i.outstandingBalance, i.currency)}
              </span>
            ),
          },
          {
            header: 'Download',
            align: 'right',
            cell: (i) => (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Download className="w-3.5 h-3.5" />}
                onClick={() => handleDownload(i.invoiceNumber)}
              >
                PDF
              </Button>
            ),
          },
        ]}
        data={invoices}
        keyExtractor={(i) => i.id}
        isLoading={loading}
        emptyMessage="You have no invoices on record."
      />
    </div>
  );
}
