'use client';

import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Alert, Input } from '@brightloop/ui';
import { SubscriptionDTO } from '@/mocks/types';
import { mockRepo } from '@/mocks/repository';
import { useApp } from '@/lib/context';
import { useToast } from '@/lib/toast';
import { formatMoney, formatDate } from '@/lib/formatters';
import { SubscriptionStatus } from '@brightloop/shared-types';
import { SubscriptionStatusBadge } from '@/components/domain/SubscriptionStatusBadge';
import { PricingSummary } from '@/components/domain/PricingSummary';
import {
  Send,
  Clock,
  CheckCircle,
  ShieldCheck,
  FileSignature,
  FileCheck2,
  Calendar,
  AlertCircle,
} from 'lucide-react';

export default function PortalQuotesPage() {
  const { refreshKey, triggerRefresh, user, scenario } = useApp();
  const { success, error } = useToast();
  const [quotes, setQuotes] = useState<SubscriptionDTO[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<SubscriptionDTO | null>(null);
  const [signerName, setSignerName] = useState(user.name);
  const [signerTitle, setSignerTitle] = useState('Authorized Officer');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [acceptedSuccess, setAcceptedSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  const customerId = 'cust-101';

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await mockRepo.getSubscriptions(customerId);
      setQuotes(data.filter((s) => s.status === SubscriptionStatus.QUOTATION));
      setLoading(false);
    }
    load();
  }, [refreshKey, scenario]);

  const handleOpenReview = (q: SubscriptionDTO) => {
    setSelectedQuote(q);
    setSignerName(user.name);
    setAgreedTerms(false);
  };

  const handleAcceptQuote = async () => {
    if (!selectedQuote || !agreedTerms) return;
    try {
      setAccepting(true);
      await mockRepo.transitionSubscription(
        selectedQuote.id,
        SubscriptionStatus.CONFIRMED,
        `${signerName} (${signerTitle})`,
      );
      const quoteNum = selectedQuote.subscriptionNumber;
      setSelectedQuote(null);
      setAcceptedSuccess(true);
      success('Quotation Accepted!', `Quotation ${quoteNum} confirmed and scheduled for activation.`);
      setTimeout(() => setAcceptedSuccess(false), 5000);
      triggerRefresh();
    } catch (err: unknown) {
      error('Acceptance failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#242f44] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              My Commercial Quotations
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#151b28] border border-[#242f44] text-[#fcee21]">
              {quotes.length} Open
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Review proposed terms, line items, and confirm commercial acceptance.
          </p>
        </div>
      </div>

      {acceptedSuccess && (
        <Alert variant="success" title="Quotation Successfully Accepted &amp; Confirmed">
          Thank you! The proposal has been digitally confirmed and transitioned to active status. Your subscription contract and automated tax invoice will be generated.
        </Alert>
      )}

      <Table<SubscriptionDTO>
        columns={[
          {
            header: 'Quotation #',
            cell: (q) => (
              <span className="font-mono font-bold text-white text-xs">
                {q.subscriptionNumber}
              </span>
            ),
          },
          {
            header: 'Plan & Commitment',
            cell: (q) => (
              <div>
                <p className="font-semibold text-white text-xs">{q.planNickname}</p>
                <p className="text-[11px] text-slate-400 font-mono capitalize">
                  {q.quantity} unit(s) • /{q.billingInterval}
                </p>
              </div>
            ),
          },
          {
            header: 'Valid Until',
            cell: (q) => (
              <div className="flex items-center gap-1.5 font-mono text-xs text-slate-300">
                <Clock className="w-3.5 h-3.5 text-[#fcee21]" />
                <span>{formatDate(q.validUntil)}</span>
              </div>
            ),
          },
          {
            header: 'Total Value',
            align: 'right',
            cell: (q) => (
              <span className="font-mono font-bold text-white text-xs">
                {formatMoney(q.totalAmount, q.currency)}
              </span>
            ),
          },
          {
            header: 'Action',
            align: 'right',
            cell: (q) => (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
                onClick={() => handleOpenReview(q)}
              >
                Review &amp; Accept
              </Button>
            ),
          },
        ]}
        data={quotes}
        keyExtractor={(q) => q.id}
        isLoading={loading}
        emptyMessage="You have no open quotations pending review."
      />

      {/* Review & Accept Modal */}
      <Modal
        isOpen={!!selectedQuote}
        onClose={() => setSelectedQuote(null)}
        title={`Review Quotation ${selectedQuote?.subscriptionNumber}`}
        description="Verify agreed scope of services, recurring pricing, and sign digitally to activate."
        maxWidth="lg"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedQuote(null)}
              disabled={accepting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAcceptQuote}
              isLoading={accepting}
              disabled={!agreedTerms || !signerName}
              leftIcon={<FileCheck2 className="w-4 h-4" />}
            >
              Digitally Sign &amp; Accept
            </Button>
          </>
        }
      >
        {selectedQuote && (
          <div className="space-y-4">
            <PricingSummary
              subtotal={selectedQuote.subtotal}
              discountAmount={selectedQuote.discountAmount}
              taxAmount={selectedQuote.taxAmount}
              totalAmount={selectedQuote.totalAmount}
              currency={selectedQuote.currency}
              compact
            />

            <div className="p-3.5 rounded-lg bg-[#08090d] border border-[#242f44] text-xs text-slate-300 space-y-1.5">
              <span className="font-bold text-white block">Commercial Terms &amp; Scope:</span>
              <p>• Billing cadence: Recurring /{selectedQuote.billingInterval} on standard settlement terms.</p>
              <p>• Statutory tax compliance: 18% standard GST applied to commercial subtotal.</p>
              <p>• Acceptance immediately binds agreement and schedules automated billing generation.</p>
            </div>

            {/* Digital Sign-off Fields */}
            <div className="p-3.5 rounded-lg bg-[#0d111a] border border-[#242f44] space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#fcee21] flex items-center gap-1.5">
                <FileSignature className="w-3.5 h-3.5" />
                Authorized Customer Sign-Off
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Signatory Full Name"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="e.g. Maya Iyer"
                  required
                />
                <Input
                  label="Signatory Corporate Title"
                  value={signerTitle}
                  onChange={(e) => setSignerTitle(e.target.value)}
                  placeholder="e.g. Chief Financial Officer"
                  required
                />
              </div>

              <label className="flex items-start gap-2.5 pt-1 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="mt-0.5 rounded border-[#242f44] bg-[#151b28] text-[#fcee21] focus:ring-[#fcee21]"
                />
                <span>
                  I confirm that I am authorized to bind the contracting customer entity to the recurring commercial terms set forth in this quotation.
                </span>
              </label>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
