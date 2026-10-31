'use client';

import React, { useState, useEffect } from 'react';
import { Card, Table, Button } from '@brightloop/ui';
import { SubscriptionDTO } from '@/mocks/types';
import { mockRepo } from '@/mocks/repository';
import { useApp } from '@/lib/context';
import { formatMoney, formatDate } from '@/lib/formatters';
import { SubscriptionStatus } from '@brightloop/shared-types';
import { SubscriptionStatusBadge } from '@/components/domain/SubscriptionStatusBadge';
import { FileSignature, ShieldCheck } from 'lucide-react';

export default function PortalSubscriptionsPage() {
  const { refreshKey, scenario } = useApp();
  const [subscriptions, setSubscriptions] = useState<SubscriptionDTO[]>([]);
  const [loading, setLoading] = useState(true);

  // Customer ID is cust-101
  const customerId = 'cust-101';

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await mockRepo.getSubscriptions(customerId);
      // Strictly own active or confirmed subscriptions
      setSubscriptions(
        data.filter(
          (s) =>
            s.status === SubscriptionStatus.ACTIVE ||
            s.status === SubscriptionStatus.CONFIRMED,
        ),
      );
      setLoading(false);
    }
    load();
  }, [refreshKey, scenario]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#242f44] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              My Subscriptions
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-[#151b28] border border-[#242f44] text-[#fcee21]">
              {subscriptions.length} Active
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Read-only overview of your active software subscriptions and recurring agreements.
          </p>
        </div>
      </div>

      <Table<SubscriptionDTO>
        columns={[
          {
            header: 'Agreement #',
            cell: (s) => (
              <span className="font-mono font-bold text-white text-xs">
                {s.subscriptionNumber}
              </span>
            ),
          },
          {
            header: 'Status',
            cell: (s) => <SubscriptionStatusBadge status={s.status} size="sm" />,
          },
          {
            header: 'Plan',
            cell: (s) => (
              <div>
                <p className="font-semibold text-white text-xs">{s.planNickname}</p>
                <p className="text-[11px] text-slate-400 font-mono capitalize">
                  {s.quantity} unit(s) • /{s.billingInterval}
                </p>
              </div>
            ),
          },
          {
            header: 'Current Period End',
            cell: (s) => (
              <span className="font-mono text-xs text-slate-300">
                {formatDate(s.currentPeriodEnd)}
              </span>
            ),
          },
          {
            header: 'Recurring Value',
            align: 'right',
            cell: (s) => (
              <span className="font-mono font-bold text-white text-xs">
                {formatMoney(s.totalAmount, s.currency)}
              </span>
            ),
          },
        ]}
        data={subscriptions}
        keyExtractor={(s) => s.id}
        isLoading={loading}
        emptyMessage="You have no active subscription agreements on file."
      />
    </div>
  );
}
