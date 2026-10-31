'use client';

import React, { useState } from 'react';
import { Button, Modal, Select, Input, Textarea, Card } from '@brightloop/ui';
import { PaymentMethod } from '@brightloop/shared-types';
import { PaymentRecordDTO } from '@/mocks/types';
import { MoneyDisplay } from './MoneyDisplay';
import { MoneyInput } from './MoneyInput';
import { formatDate } from '@/lib/formatters';
import { CreditCard, PlusCircle, CheckCircle, Receipt, ArrowRight } from 'lucide-react';
import { useToast } from '@/lib/toast';

interface Props {
  invoiceId: string;
  payments: PaymentRecordDTO[];
  outstandingBalance: string;
  totalAmount: string;
  currency?: string;
  canRecordPayment: boolean;
  onRecordPayment: (data: {
    amount: string;
    paymentMethod: PaymentMethod;
    paymentDate: string;
    referenceNote?: string;
  }) => Promise<void>;
}

export const PaymentLedger: React.FC<Props> = ({
  payments,
  outstandingBalance,
  totalAmount,
  currency = 'INR',
  canRecordPayment,
  onRecordPayment,
}) => {
  const { success, error: toastError } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amount, setAmount] = useState(outstandingBalance);
  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.BANK_TRANSFER);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [reference, setReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const val = Number(amount);
    if (isNaN(val) || val <= 0) {
      setError('Please specify a positive payment amount.');
      return;
    }
    if (val > Number(outstandingBalance)) {
      setError(`Amount cannot exceed the remaining balance of ₹${outstandingBalance}.`);
      return;
    }

    try {
      setIsSubmitting(true);
      await onRecordPayment({
        amount,
        paymentMethod: method,
        paymentDate: new Date(date).toISOString(),
        referenceNote: reference.trim() || undefined,
      });
      setIsModalOpen(false);
      setReference('');
      success('Receipt Recorded', `Payment of ₹${amount} allocated to invoice ledger.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to record payment';
      setError(msg);
      toastError('Payment Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFullySettled = Number(outstandingBalance) === 0;

  const handleQuickAmount = (pct: number) => {
    const total = Number(outstandingBalance);
    const calculated = (total * pct).toFixed(2);
    setAmount(calculated);
  };

  return (
    <Card surface="dark" className="space-y-4 border border-[#1f283d] bg-[#0c1017]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1b2333] pb-3">
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 text-[#fcee21]" />
          <h3 className="text-sm font-bold tracking-tight text-white uppercase">
            Payment Receipts &amp; Audit Ledger
          </h3>
          <span className="text-xs text-slate-400 font-mono">({payments.length} entries)</span>
        </div>

        {canRecordPayment && !isFullySettled && (
          <Button
            variant="primary"
            size="sm"
            leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
            onClick={() => {
              setAmount(outstandingBalance);
              setIsModalOpen(true);
            }}
          >
            Record Manual Receipt
          </Button>
        )}
      </div>

      {payments.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-400">
          No receipts recorded yet. Invoice has an outstanding balance of{' '}
          <MoneyDisplay amount={outstandingBalance} currency={currency} size="sm" color="yellow" />.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#1f283d] text-slate-400 uppercase font-semibold">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Method</th>
                <th className="py-2.5 px-3">Reference / Note</th>
                <th className="py-2.5 px-3">Recorded By</th>
                <th className="py-2.5 px-3 text-right">Settled Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1b2333]">
              {payments.map((p) => (
                <tr key={p.id} className="text-slate-200">
                  <td className="py-2.5 px-3 whitespace-nowrap font-mono">{formatDate(p.paymentDate)}</td>
                  <td className="py-2.5 px-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#151b28] border border-[#242f44] text-[11px] font-mono text-[#fcee21]">
                      {p.paymentMethod.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300 max-w-xs truncate">
                    {p.referenceNote || '—'}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">{p.recorderName}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                    <MoneyDisplay amount={p.amount} currency={currency} size="sm" color="success" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isFullySettled && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-300">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>Full settlement confirmed. This invoice is 100% paid and closed.</span>
        </div>
      )}

      {/* Manual Payment Entry Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Manual Receipt (Bank / Cash / Cheque)"
        description="Submit offline settlement details into the tenant financial ledger."
        maxWidth="md"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              isLoading={isSubmitting}
            >
              Save Receipt &amp; Settle
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300">
              {error}
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-[#08090d] border border-[#1f283d] flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Outstanding Balance Due:</span>
            <MoneyDisplay
              amount={outstandingBalance}
              currency={currency}
              size="md"
              color="yellow"
            />
          </div>

          {/* Quick preset amount pills */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Quick Preset Allocation
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleQuickAmount(1)}
                className="px-2.5 py-1 rounded-lg bg-[#141a27] hover:bg-[#1a2336] border border-[#222c3f] text-xs font-mono font-bold text-[#fcee21] transition-colors"
              >
                100% Full Balance
              </button>
              <button
                type="button"
                onClick={() => handleQuickAmount(0.5)}
                className="px-2.5 py-1 rounded-lg bg-[#141a27] hover:bg-[#1a2336] border border-[#222c3f] text-xs font-mono font-bold text-slate-300 transition-colors"
              >
                50% Part-Payment
              </button>
            </div>
          </div>

          <MoneyInput
            label="Receipt Amount"
            value={amount}
            onChange={setAmount}
            currency={currency}
            required
            hint={`Maximum allocatable amount is ₹${outstandingBalance}`}
          />

          <Select
            label="Settlement Method"
            value={method}
            onChange={(e) => setMethod(e.target.value as PaymentMethod)}
            options={[
              { value: PaymentMethod.BANK_TRANSFER, label: 'Bank Transfer (NEFT / RTGS / IMPS)' },
              { value: PaymentMethod.CHEQUE, label: 'Cheque / Demand Draft' },
              { value: PaymentMethod.CASH, label: 'Cash Receipt' },
              { value: PaymentMethod.GATEWAY, label: 'Gateway Offline Reconciliation' },
            ]}
            required
          />

          <Input
            label="Payment Settlement Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />

          <Textarea
            label="Audit Reference Note / UTR / Cheque Number"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="e.g. HDFC RTGS Ref #HDFCR991823, Cleared on 28th"
            required
            hint="Mandatory reference for financial reconciliation and audit verification."
          />
        </form>
      </Modal>
    </Card>
  );
};
