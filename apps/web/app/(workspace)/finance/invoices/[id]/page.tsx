'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button, Card, Modal, Alert } from '@brightloop/ui';
import { InvoiceDTO } from '@/mocks/types';
import { mockRepo } from '@/mocks/repository';
import { useApp } from '@/lib/context';
import { formatMoney, formatDate } from '@/lib/formatters';
import { InvoiceStatus, PaymentMethod } from '@brightloop/shared-types';
import { InvoiceStatusBadge } from '@/components/domain/InvoiceStatusBadge';
import { InvoiceLockNotice } from '@/components/domain/InvoiceLockNotice';
import { PricingSummary } from '@/components/domain/PricingSummary';
import { PaymentLedger } from '@/components/domain/PaymentLedger';
import { TransitionAction } from '@/components/domain/TransitionAction';
import { getPermittedInvoiceTransitions, PermittedAction, isInvoiceImmutable } from '@/lib/lifecycle';
import {
  ArrowLeft,
  Receipt,
  Download,
  Building,
  CheckCircle2,
  Lock,
  Printer,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';

export default function InvoiceDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { refreshKey, triggerRefresh, role, user, can } = useApp();

  const [invoice, setInvoice] = useState<InvoiceDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const inv = await mockRepo.getInvoiceById(id);
      if (inv) setInvoice(inv);
      setLoading(false);
    }
    load();
  }, [id, refreshKey]);

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading invoice document...</div>;
  }

  if (!invoice) {
    return (
      <div className="space-y-4">
        <Link href="/finance/invoices">
          <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Invoices
          </Button>
        </Link>
        <Alert variant="error" title="Invoice Document Not Found">
          No invoice record exists with ID {id}.
        </Alert>
      </div>
    );
  }

  const permittedActions = getPermittedInvoiceTransitions(invoice.status, role);
  const isLocked = isInvoiceImmutable(invoice.status);
  const canRecordPayment = can('payment:record') && invoice.status !== InvoiceStatus.VOID;

  const handleExecuteTransition = async (action: PermittedAction) => {
    try {
      setActionLoading(true);
      if (action.targetStatus === InvoiceStatus.CONFIRMED) {
        await mockRepo.confirmInvoice(invoice.id);
      } else if (action.targetStatus === InvoiceStatus.VOID) {
        await mockRepo.voidInvoice(invoice.id);
      }
      triggerRefresh();
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordPayment = async (data: {
    amount: string;
    paymentMethod: PaymentMethod;
    paymentDate: string;
    referenceNote?: string;
  }) => {
    await mockRepo.recordManualPayment(invoice.id, {
      ...data,
      recorderName: `${user.name} (${user.role})`,
    });
    triggerRefresh();
  };

  const handleDownloadInvoice = () => {
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
    // Trigger browser print/pdf dialog
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#242f44] pb-5">
        <div className="space-y-1">
          <Link
            href="/finance/invoices"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#fcee21] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Invoices Ledger</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-white font-mono">
              {invoice.invoiceNumber}
            </h1>
            <InvoiceStatusBadge status={invoice.status} isOverdue={invoice.isOverdue} />
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-slate-500" />
            <span>Billed to:</span>
            <Link
              href={`/customers/${invoice.customerId}`}
              className="font-bold text-white hover:text-[#fcee21]"
            >
              {invoice.customerName}
            </Link>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-3.5 h-3.5" />}
            onClick={handleDownloadInvoice}
          >
            Download / Print PDF
          </Button>

          {/* Lifecycle Action Buttons */}
          <TransitionAction
            actions={permittedActions}
            onExecute={handleExecuteTransition}
            isLoading={actionLoading}
          />
        </div>
      </div>

      {downloadSuccess && (
        <Alert variant="success" title="Download Initiated">
          Official tax invoice PDF document compiled successfully.
        </Alert>
      )}

      {/* Prominent Immutability Notice */}
      <InvoiceLockNotice status={invoice.status} />

      {/* Document Grid: Items & Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Document Card */}
          <Card surface="dark" className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#242f44] pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#fcee21]" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                  Invoice Line Item Snapshot
                </h2>
              </div>
              <div className="text-right text-xs font-mono text-slate-400">
                <span>Issue: {formatDate(invoice.issueDate)} • Due: {formatDate(invoice.dueDate)}</span>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#242f44] text-slate-400 font-semibold uppercase">
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-3">Unit Price</th>
                    <th className="py-2.5 px-3">Qty</th>
                    <th className="py-2.5 px-3 text-right">Tax (18% GST)</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1b2333]">
                  {invoice.lines.map((line) => (
                    <tr key={line.id} className="text-slate-200">
                      <td className="py-3 px-3">
                        <p className="font-bold text-white">{line.productName}</p>
                        {line.variantName && (
                          <p className="text-[11px] text-[#fcee21] font-mono">
                            {line.variantName}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono">{formatMoney(line.unitPrice, invoice.currency)}</td>
                      <td className="py-3 px-3 font-mono font-bold">{line.quantity}</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-300">
                        {formatMoney(line.taxAmount, invoice.currency)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-white">
                        {formatMoney(line.totalAmount, invoice.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Payment Receipts Ledger */}
          <PaymentLedger
            invoiceId={invoice.id}
            payments={invoice.payments}
            outstandingBalance={invoice.outstandingBalance}
            totalAmount={invoice.totalAmount}
            currency={invoice.currency}
            canRecordPayment={canRecordPayment}
            onRecordPayment={handleRecordPayment}
          />
        </div>

        {/* Right Column: Pricing Summary & Billing Meta */}
        <div className="space-y-6">
          <PricingSummary
            subtotal={invoice.subtotal}
            discountAmount={invoice.discountAmount}
            taxAmount={invoice.taxAmount}
            totalAmount={invoice.totalAmount}
            paidAmount={invoice.paidAmount}
            outstandingBalance={invoice.outstandingBalance}
            currency={invoice.currency}
          />

          <Card surface="dark" className="p-4 space-y-2 border border-[#242f44] text-xs">
            <span className="font-bold uppercase tracking-wider text-slate-400 block border-b border-[#242f44] pb-2">
              Billing Metadata
            </span>
            <div className="space-y-2 text-slate-300">
              <div className="flex items-center justify-between">
                <span>Payment Currency</span>
                <span className="font-mono font-bold text-white">{invoice.currency}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Issue Date</span>
                <span className="font-mono text-white">{formatDate(invoice.issueDate)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Payment Terms</span>
                <span className="font-mono text-white">Net 14 Days</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Due Date</span>
                <span className={`font-mono font-bold ${invoice.isOverdue ? 'text-rose-400' : 'text-white'}`}>
                  {formatDate(invoice.dueDate)}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
