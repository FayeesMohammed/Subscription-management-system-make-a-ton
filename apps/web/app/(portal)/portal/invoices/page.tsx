'use client';

import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal } from '@brightloop/ui';
import { InvoiceDTO } from '@/mocks/types';
import { mockRepo } from '@/mocks/repository';
import { useApp } from '@/lib/context';
import { formatMoney, formatDate } from '@/lib/formatters';
import { InvoiceStatusBadge } from '@/components/domain/InvoiceStatusBadge';
import { PricingSummary } from '@/components/domain/PricingSummary';
import {
  Receipt,
  Download,
  ShieldCheck,
  Printer,
  FileText,
  Building2,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

export default function PortalInvoicesPage() {
  const { refreshKey, scenario } = useApp();
  const [invoices, setInvoices] = useState<InvoiceDTO[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDTO | null>(null);
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

  const handlePrint = () => {
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
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#151b28] border border-[#242f44] text-[#fcee21]">
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
              <span className="font-mono font-bold text-xs text-[#fcee21]">
                {formatMoney(i.outstandingBalance, i.currency)}
              </span>
            ),
          },
          {
            header: 'Document Actions',
            align: 'right',
            cell: (i) => (
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<FileText className="w-3.5 h-3.5" />}
                  onClick={() => setSelectedInvoice(i)}
                >
                  View
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                  onClick={() => {
                    setSelectedInvoice(i);
                    setTimeout(() => window.print(), 300);
                  }}
                >
                  PDF
                </Button>
              </div>
            ),
          },
        ]}
        data={invoices}
        keyExtractor={(i) => i.id}
        isLoading={loading}
        emptyMessage="You have no invoices on record."
      />

      {/* Invoice Document Inspection Modal */}
      <Modal
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        title={`Tax Invoice ${selectedInvoice?.invoiceNumber}`}
        description="Official statutory fiscal document and tax breakdown."
        maxWidth="2xl"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedInvoice(null)}
            >
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Printer className="w-4 h-4" />}
              onClick={handlePrint}
            >
              Print / Save PDF
            </Button>
          </>
        }
      >
        {selectedInvoice && (
          <div className="space-y-5 print:p-0">
            {/* Invoice Header */}
            <div className="flex flex-wrap items-start justify-between gap-4 p-4 rounded-xl bg-[#08090d] border border-[#242f44]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black tracking-tight text-white">BRIGHTLOOP</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#fcee21] text-black">
                    RECURRING BILLING
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Brightloop Financial Systems Pvt. Ltd.</p>
                <p className="text-[11px] font-mono text-slate-500">GSTIN: 29AAACB1234D1Z8</p>
              </div>

              <div className="text-right">
                <span className="text-xs uppercase tracking-wider font-bold text-slate-400 block">
                  Tax Invoice
                </span>
                <span className="text-base font-extrabold font-mono text-[#fcee21] block">
                  {selectedInvoice.invoiceNumber}
                </span>
                <span className="text-xs font-mono text-slate-400 block mt-1">
                  Issued: {formatDate(selectedInvoice.issueDate)}
                </span>
                <span className="text-xs font-mono text-slate-400 block">
                  Due: {formatDate(selectedInvoice.dueDate)}
                </span>
              </div>
            </div>

            {/* Billed To Customer */}
            <div className="p-3.5 rounded-lg bg-[#0d111a] border border-[#242f44] text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Billed To (Customer):
              </span>
              <p className="font-bold text-white text-sm mt-0.5">{selectedInvoice.customerName}</p>
              <p className="text-slate-400 font-mono mt-0.5">
                GSTIN / Tax ID: {selectedInvoice.customerTaxNumber || 'Standard Unregistered Profile'}
              </p>
            </div>

            {/* Line Items Table */}
            <div className="overflow-x-auto rounded-lg border border-[#242f44]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#151b28] text-slate-300 font-semibold border-b border-[#242f44]">
                  <tr>
                    <th className="py-2 px-3">Item Description</th>
                    <th className="py-2 px-3 text-right">Qty</th>
                    <th className="py-2 px-3 text-right">Unit Price</th>
                    <th className="py-2 px-3 text-right">Net Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1b2333]">
                  {selectedInvoice.lines.map((line) => (
                    <tr key={line.id} className="text-slate-200">
                      <td className="py-2.5 px-3 font-semibold text-white">
                        {line.productName}
                        {line.variantName && (
                          <span className="text-xs text-slate-400 block font-normal">
                            Variant: {line.variantName}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">{line.quantity}</td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        {formatMoney(line.unitPrice, selectedInvoice.currency)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                        {formatMoney(line.totalAmount, selectedInvoice.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pricing Summary */}
            <PricingSummary
              subtotal={selectedInvoice.subtotal}
              discountAmount={selectedInvoice.discountAmount}
              taxAmount={selectedInvoice.taxAmount}
              totalAmount={selectedInvoice.totalAmount}
              paidAmount={selectedInvoice.paidAmount}
              outstandingBalance={selectedInvoice.outstandingBalance}
              currency={selectedInvoice.currency}
              compact
            />

            {/* Payment Receipts History */}
            {selectedInvoice.payments.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Settled Payment Receipts ({selectedInvoice.payments.length})
                </span>
                <div className="rounded-lg border border-[#242f44] overflow-hidden text-xs">
                  {selectedInvoice.payments.map((p) => (
                    <div
                      key={p.id}
                      className="p-2.5 bg-[#08090d] flex items-center justify-between border-b border-[#1b2333] last:border-b-0"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <div>
                          <span className="font-semibold text-white">{p.paymentMethod}</span>
                          <span className="text-[10px] text-slate-400 font-mono ml-2">
                            {formatDate(p.paymentDate)}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-emerald-400">
                        {formatMoney(p.amount, selectedInvoice.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
