'use client';

import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Alert } from '@brightloop/ui';
import { SubscriptionDTO } from '@/mocks/types';
import { mockRepo } from '@/mocks/repository';
import { useApp } from '@/lib/context';
import { formatMoney, formatDate } from '@/lib/formatters';
import { SubscriptionStatus } from '@brightloop/shared-types';
import { SubscriptionStatusBadge } from '@/components/domain/SubscriptionStatusBadge';
import { PricingSummary } from '@/components/domain/PricingSummary';
import { Send, Clock, CheckCircle, ShieldCheck } from 'lucide-react';

export default function PortalQuotesPage() {
  const { refreshKey, triggerRefresh, user, scenario } = useApp();
  const [quotes, setQuotes] = useState<SubscriptionDTO[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<SubscriptionDTO | null>(null);
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

  const handleAcceptQuote = async () => {
    if (!selectedQuote) return;
    try {
      setAccepting(true);
      await mockRepo.transitionSubscription(
        selectedQuote.id,
        SubscriptionStatus.CONFIRMED,
        `${user.name} (Client Acceptance)`,
      );
      setSelectedQuote(null);
      setAcceptedSuccess(true);
      setTimeout(() => setAcceptedSuccess(false), 4000);
      triggerRefresh();
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
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-[#151b28] border border-[#242f44] text-[#fcee21]">
              {quotes.length} Open
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Review proposed terms, line items, and confirm commercial acceptance.
          </p>
        </div>
      </div>

      {acceptedSuccess && (
        <Alert variant="success" title="Quotation Successfully Accepted">
          Thank you! The proposal has been confirmed and scheduled for automated billing activation.
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
                onClick={() => setSelectedQuote(q)}
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
        description="Verify agreed scope of services and commercial payment terms before confirmation."
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
            >
              Accept &amp; Confirm Agreement
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

            <div className="p-3 rounded-lg bg-[#08090d] border border-[#242f44] text-xs text-slate-300 space-y-1">
              <span className="font-bold text-white block">Commercial Terms</span>
              <p>• Billing recurrence: Monthly fixed subscription schedule.</p>
              <p>• Tax compliance: 18% GST snapshot applied.</p>
              <p>• Agreement locks upon customer confirmation.</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
