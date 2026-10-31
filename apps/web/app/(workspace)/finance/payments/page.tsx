'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button, Input, Table, Card, Modal, Select, Textarea } from '@brightloop/ui';
import { InvoiceDTO, PaymentRecordDTO } from '@/mocks/types';
import { mockRepo } from '@/mocks/repository';
import { useApp } from '@/lib/context';
import { useToast } from '@/lib/toast';
import { formatMoney, formatDate, formatDateTime } from '@/lib/formatters';
import { PaymentMethod } from '@brightloop/shared-types';
import {
  CreditCard,
  PlusCircle,
  Search,
  ShieldCheck,
  CheckCircle2,
  Download,
  Building,
  Coins,
  FileCheck,
  ArrowDownLeft,
} from 'lucide-react';
import { MoneyInput } from '@/components/domain/MoneyInput';
import Link from 'next/link';

export default function PaymentsPage() {
  const { refreshKey, triggerRefresh, user, can } = useApp();
  const { success, error } = useToast();
  const [invoices, setInvoices] = useState<InvoiceDTO[]>([]);
  const [allPayments, setAllPayments] = useState<
    (PaymentRecordDTO & { invoiceNumber: string; customerName: string; currency: string })[]
  >([]);
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Record Payment Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [amount, setAmount] = useState('5000.00');
  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.BANK_TRANSFER);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [reference, setReference] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const invs = await mockRepo.getInvoices();
      setInvoices(invs);

      const records: (PaymentRecordDTO & {
        invoiceNumber: string;
        customerName: string;
        currency: string;
      })[] = [];
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

  const selectedInv = invoices.find((i) => i.id === selectedInvoiceId);

  const filtered = useMemo(() => {
    return allPayments.filter((p) => {
      const matchesMethod = methodFilter === 'ALL' || p.paymentMethod === methodFilter;
      const matchesSearch =
        p.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
        p.customerName.toLowerCase().includes(search.toLowerCase()) ||
        (p.referenceNote && p.referenceNote.toLowerCase().includes(search.toLowerCase()));
      return matchesMethod && matchesSearch;
    });
  }, [allPayments, methodFilter, search]);

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        ['Payment ID', 'Invoice #', 'Customer', 'Method', 'Amount (INR)', 'Date', 'Reference', 'Recorder'].join(','),
        ...filtered.map((p) =>
          [
            p.id,
            p.invoiceNumber,
            `"${p.customerName}"`,
            p.paymentMethod,
            p.amount,
            p.paymentDate,
            `"${p.referenceNote || ''}"`,
            `"${p.recorderName}"`,
          ].join(','),
        ),
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Brightloop_Payments_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    success('Payment Ledger Exported', `Generated CSV with ${filtered.length} payment records.`);
  };

  const handleRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId) return;
    setRecordError(null);

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
      success('Payment Receipt Recorded', `Logged ${formatMoney(amount)} for ${selectedInv?.invoiceNumber}.`);
      triggerRefresh();
    } catch (err: unknown) {
      setRecordError(err instanceof Error ? err.message : 'Failed to record receipt');
      error('Payment Failed', err instanceof Error ? err.message : 'Validation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const totalCollected = allPayments.reduce((acc, p) => acc + Number(p.amount), 0);
  const bankTransferTotal = allPayments
    .filter((p) => p.paymentMethod === PaymentMethod.BANK_TRANSFER)
    .reduce((acc, p) => acc + Number(p.amount), 0);
  const cashChequeTotal = allPayments
    .filter((p) => p.paymentMethod !== PaymentMethod.BANK_TRANSFER)
    .reduce((acc, p) => acc + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#242f44] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              Payment Receipts &amp; Ledger
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#151b28] border border-[#242f44] text-[#fcee21]">
              {allPayments.length} Transactions
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Manual Bank Transfer, Cash, and Cheque settlement logs with permanent audit trails.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={handleExportCSV}
          >
            Export CSV
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<PlusCircle className="w-4 h-4" />}
            onClick={() => setIsModalOpen(true)}
          >
            Record Payment Receipt
          </Button>
        </div>
      </div>

      {/* Payment Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-[#0d111a] border border-[#242f44] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Realized Collections
            </span>
            <p className="text-xl font-extrabold font-mono text-emerald-400 mt-1">
              {formatMoney(totalCollected)}
            </p>
            <span className="text-[11px] text-slate-400">{allPayments.length} reconciled receipts</span>
          </div>
          <ArrowDownLeft className="w-6 h-6 text-emerald-400" />
        </div>

        <div className="p-3.5 rounded-xl bg-[#0d111a] border border-[#242f44] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Bank Wire / NEFT / RTGS
            </span>
            <p className="text-xl font-extrabold font-mono text-[#fcee21] mt-1">
              {formatMoney(bankTransferTotal)}
            </p>
            <span className="text-[11px] text-slate-400">Direct commercial transfers</span>
          </div>
          <Building className="w-6 h-6 text-[#fcee21]" />
        </div>

        <div className="p-3.5 rounded-xl bg-[#0d111a] border border-[#242f44] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Cash &amp; Cheque Receipts
            </span>
            <p className="text-xl font-extrabold font-mono text-cyan-400 mt-1">
              {formatMoney(cashChequeTotal)}
            </p>
            <span className="text-[11px] text-slate-400">Physical receipt instruments</span>
          </div>
          <Coins className="w-6 h-6 text-cyan-400" />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search by invoice #, customer or reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftAddon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: `All Receipts (${allPayments.length})` },
            { id: PaymentMethod.BANK_TRANSFER, label: 'Bank Transfer' },
            { id: PaymentMethod.CASH, label: 'Cash' },
            { id: PaymentMethod.CHEQUE, label: 'Cheque' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setMethodFilter(m.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                methodFilter === m.id
                  ? 'bg-[#fcee21] text-black font-bold shadow-sm'
                  : 'bg-[#151b28] text-slate-400 hover:text-white border border-[#242f44]'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Payments Ledger Table */}
      <Table<PaymentRecordDTO & { invoiceNumber: string; customerName: string; currency: string }>
        columns={[
          {
            header: 'Receipt ID',
            cell: (p) => (
              <span className="font-mono text-xs text-slate-400">
                {p.id}
              </span>
            ),
          },
          {
            header: 'Invoice #',
            cell: (p) => (
              <Link
                href={`/finance/invoices/${p.invoiceId}`}
                className="font-bold text-white hover:text-[#fcee21] font-mono text-xs"
              >
                {p.invoiceNumber}
              </Link>
            ),
          },
          {
            header: 'Customer',
            cell: (p) => (
              <span className="text-xs font-semibold text-slate-200">{p.customerName}</span>
            ),
          },
          {
            header: 'Instrument',
            cell: (p) => (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#151b28] border border-[#242f44] text-[#fcee21]">
                {p.paymentMethod}
              </span>
            ),
          },
          {
            header: 'Amount Settled',
            align: 'right',
            cell: (p) => (
              <span className="font-mono font-bold text-xs text-emerald-400">
                {formatMoney(p.amount, p.currency)}
              </span>
            ),
          },
          {
            header: 'Payment Date',
            cell: (p) => (
              <span className="text-xs font-mono text-slate-300">
                {formatDate(p.paymentDate)}
              </span>
            ),
          },
          {
            header: 'Reference / UTR',
            cell: (p) => (
              <span className="font-mono text-xs text-slate-400">
                {p.referenceNote || '—'}
              </span>
            ),
          },
          {
            header: 'Audited Recorder',
            cell: (p) => (
              <span className="text-xs text-slate-400 font-mono">
                {p.recorderName}
              </span>
            ),
          },
        ]}
        data={filtered}
        keyExtractor={(p) => p.id}
        isLoading={loading}
        emptyMessage="No payment transactions match your search or filter."
      />

      {/* Modal: Record Manual Payment */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Commercial Payment Receipt"
        description="Source requirement: Manual Bank/Cash/Cheque receipts and partial payments with audit traceability."
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
              Post Settlement Receipt
            </Button>
          </>
        }
      >
        <form onSubmit={handleRecord} className="space-y-4">
          {recordError && (
            <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-xs text-rose-300">
              {recordError}
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
              label: `${i.invoiceNumber} — ${i.customerName} (Bal: ${formatMoney(i.outstandingBalance, i.currency)})`,
            }))}
          />

          {selectedInv && (
            <div className="p-3 rounded-lg bg-[#08090d] border border-[#242f44] flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 block">Total Invoiced:</span>
                <span className="font-mono font-bold text-white">
                  {formatMoney(selectedInv.totalAmount, selectedInv.currency)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Already Paid:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {formatMoney(selectedInv.paidAmount, selectedInv.currency)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Outstanding Due:</span>
                <span className="font-mono font-bold text-[#fcee21]">
                  {formatMoney(selectedInv.outstandingBalance, selectedInv.currency)}
                </span>
              </div>
            </div>
          )}

          <div>
            <MoneyInput
              label="Payment Amount to Record (INR)"
              value={amount}
              onChange={setAmount}
              required
            />
            {selectedInv && Number(selectedInv.outstandingBalance) > 0 && (
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setAmount(selectedInv.outstandingBalance)}
                  className="px-2 py-1 text-[11px] rounded bg-[#151b28] border border-[#242f44] text-[#fcee21] hover:bg-[#1f293d]"
                >
                  Full Settlement ({formatMoney(selectedInv.outstandingBalance, selectedInv.currency)})
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setAmount((Number(selectedInv.outstandingBalance) / 2).toFixed(2))
                  }
                  className="px-2 py-1 text-[11px] rounded bg-[#151b28] border border-[#242f44] text-slate-300 hover:bg-[#1f293d]"
                >
                  50% Partial ({formatMoney(Number(selectedInv.outstandingBalance) / 2, selectedInv.currency)})
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Payment Instrument / Method"
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              options={[
                { value: PaymentMethod.BANK_TRANSFER, label: 'BANK_TRANSFER (NEFT/RTGS/IMPS)' },
                { value: PaymentMethod.CASH, label: 'CASH (Physical Currency)' },
                { value: PaymentMethod.CHEQUE, label: 'CHEQUE (Demand Draft/Cheque)' },
              ]}
            />
            <Input
              label="Receipt Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <Input
            label="Transaction Reference / Cheque # / UTR"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="e.g. UTR-HDFC-9928174 or CHQ-00192"
            hint="Permanent bank reconciliation reference"
          />
        </form>
      </Modal>
    </div>
  );
}
