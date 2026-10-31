'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button, Card, Modal, Alert } from '@brightloop/ui';
import { InvoiceDTO } from '@/mocks/types';
import { mockRepo } from '@/mocks/repository';
import { useApp } from '@/lib/context';
import { useToast } from '@/lib/toast';
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
  FileCheck,
  Shield,
} from 'lucide-react';
import Link from 'next/link';

export default function InvoiceDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { refreshKey, triggerRefresh, role, user, can } = useApp();
  const { success, error: toastError, info } = useToast();

  const [invoice, setInvoice] = useState<InvoiceDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

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
        success('Invoice Confirmed & Locked', 'Document snapshot is now permanently immutable.');
      } else if (action.targetStatus === InvoiceStatus.VOID) {
        await mockRepo.voidInvoice(invoice.id);
        info('Invoice Voided', 'Invoice has been canceled.');
      }
      triggerRefresh();
    } catch (err: unknown) {
      toastError('Action Failed', err instanceof Error ? err.message : 'Unknown error');
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1f283d] pb-5">
        <div className="space-y-1">
          <Link
            href="/finance/invoices"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#fcee21] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Invoices Ledger</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-white font-mono">
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
            leftIcon={<Printer className="w-3.5 h-3.5" />}
            onClick={handlePrint}
          >
            Download / Print PDF
          </Button>

          {/* Permitted Lifecycle Action Buttons */}
          <TransitionAction
            actions={permittedActions}
            onExecute={handleExecuteTransition}
            isLoading={actionLoading}
          />
        </div>
      </div>

      {/* Prominent Immutability Notice */}
      <InvoiceLockNotice status={invoice.status} />

      {/* Document Grid: Items & Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Printable Official Tax Invoice Container */}
          <Card surface="dark" className="relative space-y-5 border border-[#1f283d] bg-[#0c1017] p-6 overflow-hidden">
            {/* Watermark Status Stamp */}
            <div className="absolute right-6 top-6 pointer-events-none select-none opacity-80 rotate-12">
              {invoice.status === InvoiceStatus.PAID ? (
                <div className="border-4 border-emerald-500 text-emerald-400 font-mono font-black text-2xl uppercase px-4 py-1 rounded-xl tracking-widest shadow-lg">
                  PAID
                </div>
              ) : invoice.isOverdue ? (
                <div className="border-4 border-rose-500 text-rose-400 font-mono font-black text-2xl uppercase px-4 py-1 rounded-xl tracking-widest shadow-lg animate-pulse">
                  OVERDUE
                </div>
              ) : isLocked ? (
                <div className="border-4 border-amber-500 text-amber-400 font-mono font-black text-xl uppercase px-4 py-1 rounded-xl tracking-widest shadow-lg">
                  LOCKED
                </div>
              ) : (
                <div className="border-4 border-slate-600 text-slate-400 font-mono font-black text-xl uppercase px-4 py-1 rounded-xl tracking-widest shadow-lg">
                  DRAFT
                </div>
              )}
            </div>

            {/* Invoice Header Details */}
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-[#1f283d] text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Supplier Organization
                </span>
                <p className="font-bold text-white text-sm mt-0.5">{user.tenantName}</p>
                <p className="text-slate-400 font-mono text-[11px]">GSTIN: 29AABCB1234F1Z1</p>
                <p className="text-slate-400 text-[11px]">Bengaluru, Karnataka, IN</p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Billed Recipient
                </span>
                <p className="font-bold text-white text-sm mt-0.5">{invoice.customerName}</p>
                <p className="text-slate-400 font-mono text-[11px]">{invoice.customerEmail}</p>
                <p className="text-slate-400 text-[11px]">Place of Supply: Karnataka (29)</p>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#1f283d] text-slate-400 font-semibold uppercase">
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

            {/* GST Tax Breakup Table */}
            <div className="pt-3 border-t border-[#1f283d] text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Statutory Tax Breakup (SAC 998313 — Information Technology Software Services)
              </span>
              <div className="grid grid-cols-3 gap-2 text-[11px] font-mono p-2.5 rounded-xl bg-[#121622] border border-[#1f283d]">
                <div>
                  <span className="text-slate-400 block">CGST (9%)</span>
                  <span className="font-bold text-white">
                    {formatMoney(Number(invoice.taxAmount) / 2, invoice.currency)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">SGST (9%)</span>
                  <span className="font-bold text-white">
                    {formatMoney(Number(invoice.taxAmount) / 2, invoice.currency)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Total GST Retained</span>
                  <span className="font-bold text-[#fcee21]">
                    {formatMoney(invoice.taxAmount, invoice.currency)}
                  </span>
                </div>
              </div>
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

          <Card surface="dark" className="p-4 space-y-2 border border-[#1f283d] bg-[#0c1017] text-xs">
            <span className="font-bold uppercase tracking-wider text-slate-400 block border-b border-[#1b2333] pb-2">
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
