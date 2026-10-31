'use client';

import React, { useState, useEffect } from 'react';
import { Button, Input, Table, Card } from '@brightloop/ui';
import { SubscriptionDTO } from '@/mocks/types';
import { mockRepo } from '@/mocks/repository';
import { useApp } from '@/lib/context';
import { formatMoney, formatDate } from '@/lib/formatters';
import { SubscriptionStatus } from '@brightloop/shared-types';
import { SubscriptionStatusBadge } from '@/components/domain/SubscriptionStatusBadge';
import { FileSignature, PlusCircle, Search, Filter } from 'lucide-react';
import Link from 'next/link';

export default function SubscriptionsPage() {
  const { refreshKey } = useApp();
  const [subscriptions, setSubscriptions] = useState<SubscriptionDTO[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await mockRepo.getSubscriptions();
      setSubscriptions(data);
      setLoading(false);
    }
    load();
  }, [refreshKey]);

  const filtered = subscriptions.filter((s) => {
    const matchesStatus =
      statusFilter === 'ALL' || s.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesSearch =
      s.subscriptionNumber.toLowerCase().includes(search.toLowerCase()) ||
      s.customerName.toLowerCase().includes(search.toLowerCase()) ||
      s.planNickname.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#242f44] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              Subscription Lifecycle
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-[#151b28] border border-[#242f44] text-slate-300">
              {subscriptions.length} Total Contracts
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Lifecycle state machine: DRAFT → QUOTATION → CONFIRMED → ACTIVE → CLOSED.
          </p>
        </div>

        <Link href="/sales/quotes">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<PlusCircle className="w-4 h-4" />}
          >
            New Quotation
          </Button>
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="max-w-xs w-full">
          <Input
            placeholder="Search by SUB # or customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftAddon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-semibold mr-1">Status:</span>
          {(['ALL', 'draft', 'quotation', 'confirmed', 'active', 'closed'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-bold uppercase transition-all whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-[#fcee21] text-black shadow-sm'
                  : 'bg-[#0d111a] text-slate-400 hover:text-white border border-[#242f44]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Table<SubscriptionDTO>
        columns={[
          {
            header: 'Contract ID',
            cell: (s) => (
              <div className="space-y-0.5">
                <Link
                  href={`/sales/subscriptions/${s.id}`}
                  className="font-bold text-white hover:text-[#fcee21] font-mono text-xs flex items-center gap-1.5"
                >
                  <FileSignature className="w-3.5 h-3.5 text-[#fcee21]" />
                  <span>{s.subscriptionNumber}</span>
                </Link>
                <p className="text-[11px] text-slate-400">{s.customerName}</p>
              </div>
            ),
          },
          {
            header: 'Lifecycle State',
            cell: (s) => <SubscriptionStatusBadge status={s.status} size="sm" />,
          },
          {
            header: 'Plan / Frequency',
            cell: (s) => (
              <div>
                <p className="text-xs font-semibold text-slate-200">{s.planNickname}</p>
                <p className="text-[11px] text-slate-400 font-mono capitalize">
                  {s.quantity} unit(s) • /{s.billingInterval}
                </p>
              </div>
            ),
          },
          {
            header: 'Period End',
            cell: (s) => (
              <span className="font-mono text-xs text-slate-300">
                {formatDate(s.currentPeriodEnd)}
              </span>
            ),
          },
          {
            header: 'Commercial Value',
            align: 'right',
            cell: (s) => (
              <span className="font-mono font-bold text-xs text-white">
                {formatMoney(s.totalAmount, s.currency)}
              </span>
            ),
          },
          {
            header: 'Action',
            align: 'right',
            cell: (s) => (
              <Link href={`/sales/subscriptions/${s.id}`}>
                <Button variant="outline" size="sm">
                  View Lifecycle
                </Button>
              </Link>
            ),
          },
        ]}
        data={filtered}
        keyExtractor={(s) => s.id}
        isLoading={loading}
        emptyMessage="No subscription agreements match the current filter."
      />
    </div>
  );
}
