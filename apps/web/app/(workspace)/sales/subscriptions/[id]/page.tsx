'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button, Card, Table, Alert } from '@brightloop/ui';
import { SubscriptionDTO } from '@/mocks/types';
import { mockRepo } from '@/mocks/repository';
import { useApp } from '@/lib/context';
import { useToast } from '@/lib/toast';
import { formatMoney, formatDate, formatDateTime } from '@/lib/formatters';
import { SubscriptionStatus } from '@brightloop/shared-types';
import { SubscriptionStatusBadge } from '@/components/domain/SubscriptionStatusBadge';
import { TransitionAction } from '@/components/domain/TransitionAction';
import { PricingSummary } from '@/components/domain/PricingSummary';
import { getPermittedSubscriptionTransitions, PermittedAction } from '@/lib/lifecycle';
import {
  ArrowLeft,
  FileSignature,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  Bot,
  UserCheck,
  Check,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

export default function SubscriptionDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { refreshKey, triggerRefresh, role, user } = useApp();
  const { success, error } = useToast();

  const [subscription, setSubscription] = useState<SubscriptionDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const sub = await mockRepo.getSubscriptionById(id);
      if (sub) setSubscription(sub);
      setLoading(false);
    }
    load();
  }, [id, refreshKey]);

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading subscription lifecycle...</div>;
  }

  if (!subscription) {
    return (
      <div className="space-y-4">
        <Link href="/sales/subscriptions">
          <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Subscriptions
          </Button>
        </Link>
        <Alert variant="error" title="Subscription Not Found">
          No contract record exists with ID {id}.
        </Alert>
      </div>
    );
  }

  const permittedActions = getPermittedSubscriptionTransitions(subscription.status, role);

  const handleExecuteTransition = async (action: PermittedAction) => {
    try {
      setTransitioning(true);
      await mockRepo.transitionSubscription(
        subscription.id,
        action.targetStatus as SubscriptionStatus,
        `${user.name} (${user.role})`,
      );
      success(
        `State Advanced to ${action.targetStatus.toUpperCase()}`,
        `Subscription ${subscription.subscriptionNumber} lifecycle stage updated.`,
      );
      triggerRefresh();
    } catch (err: unknown) {
      error('Transition Rejected', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setTransitioning(false);
    }
  };

  const lifecycleStages = [
    SubscriptionStatus.DRAFT,
    SubscriptionStatus.QUOTATION,
    SubscriptionStatus.CONFIRMED,
    SubscriptionStatus.ACTIVE,
    SubscriptionStatus.CLOSED,
  ];

  const currentStageIndex = lifecycleStages.indexOf(
    subscription.status.toLowerCase() as SubscriptionStatus,
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1f283d] pb-5">
        <div className="space-y-1">
          <Link
            href="/sales/subscriptions"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#fcee21] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Subscriptions</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-white font-mono">
              {subscription.subscriptionNumber}
            </h1>
            <SubscriptionStatusBadge status={subscription.status} />
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-slate-500" />
            <span>Customer:</span>
            <Link
              href={`/customers/${subscription.customerId}`}
              className="font-bold text-white hover:text-[#fcee21]"
            >
              {subscription.customerName}
            </Link>
          </p>
        </div>

        {/* Transition Action Buttons */}
        <div>
          <TransitionAction
            actions={permittedActions}
            onExecute={handleExecuteTransition}
            isLoading={transitioning}
          />
        </div>
      </div>

      {/* Visual Lifecycle Pipeline Stepper */}
      <Card surface="dark" className="p-5 border border-[#1f283d] bg-[#0c1017]">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">
            Commercial Lifecycle Progression
          </span>
          <span className="text-xs font-mono text-[#fcee21] font-semibold">
            Stage {currentStageIndex + 1} of {lifecycleStages.length}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center text-xs">
          {lifecycleStages.map((stage, idx) => {
            const isCompleted = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex;
            return (
              <div
                key={stage}
                className={`relative p-3 rounded-xl border transition-all ${
                  isCurrent
                    ? 'bg-[#fcee21] text-black border-[#fcee21] font-black shadow-[0_0_12px_rgba(252,238,33,0.3)]'
                    : isCompleted
                    ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800 font-semibold'
                    : 'bg-[#121622] text-slate-500 border-[#1f283d]'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : isCurrent ? (
                    <Zap className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-600" />
                  )}
                  <span className="text-[10px] uppercase tracking-wider opacity-80">
                    Step 0{idx + 1}
                  </span>
                </div>
                <span className="font-mono uppercase font-bold">{stage}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Main Grid: Details & Pricing Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Line Items & Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Line Items Card */}
          <Card surface="dark" className="space-y-3 border border-[#1f283d] bg-[#0c1017]">
            <div className="flex items-center justify-between border-b border-[#1b2333] pb-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                Contracted Products &amp; Line Items
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#1f283d] text-slate-400 font-semibold uppercase">
                    <th className="py-2.5 px-3">Product / Module</th>
                    <th className="py-2.5 px-3">Unit Price</th>
                    <th className="py-2.5 px-3">Qty</th>
                    <th className="py-2.5 px-3 text-right">Tax (18%)</th>
                    <th className="py-2.5 px-3 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1b2333]">
                  {subscription.lines.map((l) => (
                    <tr key={l.id} className="text-slate-200">
                      <td className="py-3 px-3">
                        <p className="font-bold text-white">{l.productName}</p>
                        {l.variantName && (
                          <p className="text-[11px] text-[#fcee21] font-mono">
                            Tier Variant: {l.variantName}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono">{formatMoney(l.unitPrice, subscription.currency)}</td>
                      <td className="py-3 px-3 font-mono font-bold">{l.quantity}</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-300">
                        {formatMoney(l.taxAmount, subscription.currency)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-white">
                        {formatMoney(l.totalAmount, subscription.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Audit Timeline */}
          <Card surface="dark" className="space-y-4 border border-[#1f283d] bg-[#0c1017]">
            <div className="flex items-center justify-between border-b border-[#1b2333] pb-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                Audit Timeline &amp; State Transitions
              </h2>
            </div>

            <div className="relative pl-6 space-y-4 border-l border-[#1f283d]">
              {subscription.timeline.map((evt) => (
                <div key={evt.id} className="relative group">
                  <div
                    className={`absolute -left-[31px] top-1 p-1 rounded-full border shadow-sm ${
                      evt.isSystemManaged
                        ? 'bg-sky-950 border-sky-600 text-sky-400'
                        : 'bg-[#fcee21] border-[#fcee21] text-black font-bold'
                    }`}
                  >
                    {evt.isSystemManaged ? (
                      <Bot className="w-3 h-3" />
                    ) : (
                      <UserCheck className="w-3 h-3" />
                    )}
                  </div>

                  <div className="space-y-1 p-2.5 rounded-xl bg-[#121622]/40 hover:bg-[#121622] transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{evt.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatDateTime(evt.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{evt.description}</p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      Actor Signature: <span className="text-slate-300 font-semibold">{evt.actor}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Pricing Summary & Contract Parameters */}
        <div className="space-y-6">
          <PricingSummary
            subtotal={subscription.subtotal}
            discountAmount={subscription.discountAmount}
            discountCode={subscription.discountCode}
            taxAmount={subscription.taxAmount}
            totalAmount={subscription.totalAmount}
            currency={subscription.currency}
          />

          <Card surface="dark" className="space-y-3 p-4 border border-[#1f283d] bg-[#0c1017] text-xs">
            <span className="font-bold uppercase tracking-wider text-slate-400 block border-b border-[#1b2333] pb-2">
              Contract Terms
            </span>
            <div className="space-y-2 text-slate-300">
              <div className="flex items-center justify-between">
                <span>Billing Interval</span>
                <span className="font-mono capitalize font-bold text-white">
                  {subscription.billingInterval}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Start Date</span>
                <span className="font-mono text-white">
                  {formatDate(subscription.startDate)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Current Period End</span>
                <span className="font-mono text-white">
                  {formatDate(subscription.currentPeriodEnd)}
                </span>
              </div>
              {subscription.validUntil && (
                <div className="flex items-center justify-between text-amber-300 font-semibold">
                  <span>Quotation Expiry</span>
                  <span className="font-mono font-bold">
                    {formatDate(subscription.validUntil)}
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
