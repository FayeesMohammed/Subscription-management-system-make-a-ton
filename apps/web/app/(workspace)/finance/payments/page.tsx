'use client';

import React, { useState, useEffect } from 'react';
import { Button, Input, Table, Card, Modal, Select, Textarea } from '@brightloop/ui';
import { InvoiceDTO, PaymentRecordDTO } from '@/mocks/types';
import { mockRepo } from '@/mocks/repository';
import { useApp } from '@/lib/context';
import { formatMoney, formatDate, formatDateTime } from '@/lib/formatters';
import { PaymentMethod } from '@brightloop/shared-types';
import { CreditCard, PlusCircle, Search, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { MoneyInput } from '@/components/domain/MoneyInput';
import Link from 'next/link';

export default function PaymentsPage() {
  const { refreshKey, triggerRefresh, user, can } = useApp();
  const [invoices, setInvoices] = useState<InvoiceDTO[]>([]);
  const [allPayments, setAllPayments] = useState<(PaymentRecordDTO & { invoiceNumber: string; customerName: string; currency: string })[]>([]);
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  // Record Payment Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [amount, setAmount] = useState('5000.00');
  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.BANK_TRANSFER);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [reference, setReference] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const invs = await mockRepo.getInvoices();
      setInvoices(invs);

      const records: (PaymentRecordDTO & { invoiceNumber: string; customerName: string; currency: string })[] = [];
      for (const inv of invs) {
        for (const p of inv.payments) {
          records.push({
            ...p,
            invoiceNumber: inv.invoiceNumber,
            customerName: inv.customerName,
            currency: inv.currency,
          });
        }
      }
      setAllPayments(records);

      const unpaid = invs.find((i) => Number(i.outstandingBalance) > 0);
      if (unpaid) {
        setSelectedInvoiceId(unpaid.id);
        setAmount(unpaid.outstandingBalance);
      } else if (invs.length > 0) {
        setSelectedInvoiceId(invs[0].id);
      }

      setLoading(false);
    }
    load();
  }, [refreshKey]);

  const filtered = allPayments.filter((p) => {
    if (methodFilter === 'ALL') return true;
    return p.paymentMethod === methodFilter;
  });

  const selectedInv = invoices.find((i) => i.id === selectedInvoiceId);

  const handleRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId) return;
    setError(null);

    try {
      setSubmitting(true);
      await mockRepo.recordManualPayment(selectedInvoiceId, {
        amount,
        paymentMethod: method,
        paymentDate: new Date(date).toISOString(),
        referenceNote: reference.trim() || undefined,
        recorderName: `${user.name} (${user.role})`,
      });
      setIsModalOpen(false);
      setReference('');
      triggerRefresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to record receipt');
    } finally {
      setSubmitting(false);
    }
  };

  const totalCollected = allPayments.reduce(
    (acc, p) => acc + Number(p.amount),
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#242f44] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              Manual Payments &amp; Settlement Ledger
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-[#151b28] border border-[#242f44] text-[#fcee21]">
              {allPayments.length} Settled Receipts
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Offline reconciliation for Bank Transfers (NEFT/RTGS), Demand Drafts, Cash, and Cheques.
          </p>
        </div>

        {can('payment:record') && (
          <Button
            variant="primary"
            size="sm"
            leftIcon={<PlusCircle className="w-4 h-4" />}
            onClick={() => setIsModalOpen(true)}
          >
            Record Manual Receipt
          </Button>
        )}
      </div>

      {/* Method Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 font-semibold mr-1">Method:</span>
        {(['ALL', 'BANK_TRANSFER', 'CHEQUE', 'CASH', 'GATEWAY'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMethodFilter(m)}
            className={`px-3 py-1.5 rounded-lg font-bold uppercase transition-all whitespace-nowrap ${
              methodFilter === m
                ? 'bg-[#fcee21] text-black shadow-sm'
                : 'bg-[#0d111a] text-slate-400 hover:text-white border border-[#242f44]'
            }`}
          >
            {m.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Ledger Table */}
      <Table<(typeof allPayments)[0]>
        columns={[
          {
            header: 'Settlement Date',
            cell: (p) => (
              <span className="font-mono text-xs text-slate-200">
                {formatDateTime(p.paymentDate)}
              </span>
            ),
          },
          {
            header: 'Associated Invoice',
            cell: (p) => (
              <div className="space-y-0.5">
                <Link
                  href={`/finance/invoices/${p.invoiceId}`}
                  className="font-bold text-white hover:text-[#fcee21] font-mono text-xs"
                >
                  {p.invoiceNumber}
                </Link>
                <p className="text-[11px] text-slate-400">{p.customerName}</p>
              </div>
            ),
          },
          {
            header: 'Method',
            cell: (p) => (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#151b28] border border-[#242f44] text-[#fcee21]">
                {p.paymentMethod.replace('_', ' ')}
              </span>
            ),
          },
          {
            header: 'Audit Reference',
            cell: (p) => (
              <span className="text-xs text-slate-300 font-mono">
                {p.referenceNote || '—'}
              </span>
            ),
          },
          {
            header: 'Recorded By',
            cell: (p) => <span className="text-xs text-slate-400">{p.recorderName}</span>,
          },
          {
            header: 'Settled Amount',
            align: 'right',
            cell: (p) => (
              <span className="font-mono font-bold text-emerald-400 text-xs">
                {formatMoney(p.amount, p.currency)}
              </span>
            ),
          },
        ]}
        data={filtered}
        keyExtractor={(p) => p.id}
        isLoading={loading}
        emptyMessage="No manual payments match this method filter."
      />

      {/* Modal: Record Manual Payment */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Manual Receipt into Ledger"
        description="Select confirmed invoice, enter payment method, UTR reference, and exact settlement amount."
        maxWidth="lg"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleRecord}
              isLoading={submitting}
            >
              Post Receipt & Settle
            </Button>
          </>
        }
      >
        <form onSubmit={handleRecord} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-xs text-rose-300">
              {error}
            </div>
          )}

          <Select
            label="Target Invoice"
            value={selectedInvoiceId}
            onChange={(e) => {
              setSelectedInvoiceId(e.target.value);
              const inv = invoices.find((i) => i.id === e.target.value);
              if (inv) setAmount(inv.outstandingBalance);
            }}
            options={invoices.map((i) => ({
              value: i.id,
              label: `${i.invoiceNumber} — ${i.customerName} (Bal: ${formatMoney(i.outstandingBalance)})`,
            }))}
            required
          />

          {selectedInv && (
            <div className="p-3 rounded-lg bg-[#08090d] border border-[#242f44] flex items-center justify-between text-xs">
              <span className="text-slate-400">Current Outstanding Balance:</span>
              <span className="font-mono font-bold text-[#fcee21] text-sm">
                {formatMoney(selectedInv.outstandingBalance)}
              </span>
            </div>
          )}

          <MoneyInput
            label="Payment Amount (INR)"
            value={amount}
            onChange={setAmount}
            required
            hint="Supports partial payments. Full payment automatically transitions invoice to PAID."
          />

          <Select
            label="Settlement Method"
            value={method}
            onChange={(e) => setMethod(e.target.value as PaymentMethod)}
            options={[
              { value: PaymentMethod.BANK_TRANSFER, label: 'Bank Transfer (NEFT / RTGS / IMPS)' },
              { value: PaymentMethod.CHEQUE, label: 'Cheque / Demand Draft' },
              { value: PaymentMethod.CASH, label: 'Cash Receipt' },
              { value: PaymentMethod.GATEWAY, label: 'Gateway Offline Entry' },
            ]}
          />

          <Input
            label="Payment Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />

          <Textarea
            label="UTR / Cheque Number / Transaction Reference"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="e.g. UTR #CITIN2601928491, cleared on Bank statement"
            required
          />
        </form>
      </Modal>
    </div>
  );
}
