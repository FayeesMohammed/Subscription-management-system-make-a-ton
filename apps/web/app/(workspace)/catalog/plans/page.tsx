'use client';

import React, { useState, useEffect } from 'react';
import { Button, Input, Table, Modal, Card, Select } from '@brightloop/ui';
import { PlanDTO, ProductDTO } from '@/mocks/types';
import { mockRepo } from '@/mocks/repository';
import { useApp } from '@/lib/context';
import { formatMoney } from '@/lib/formatters';
import { BillingInterval, PricingModel } from '@brightloop/shared-types';
import { PlusCircle, Layers, Calendar, RefreshCw, AlertCircle } from 'lucide-react';
import { MoneyInput } from '@/components/domain/MoneyInput';
import { PlanRuleSummary } from '@/components/domain/PlanRuleSummary';

export default function PlansPage() {
  const { refreshKey, triggerRefresh } = useApp();
  const [plans, setPlans] = useState<PlanDTO[]>([]);
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [loading, setLoading] = useState(true);

  // New Plan Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productId, setProductId] = useState('');
  const [nickname, setNickname] = useState('');
  const [unitAmount, setUnitAmount] = useState('10000.00');
  const [billingInterval, setBillingInterval] = useState<BillingInterval>(BillingInterval.MONTH);
  const [billingIntervalCount, setBillingIntervalCount] = useState(1);
  const [pricingModel, setPricingModel] = useState<PricingModel>(PricingModel.FIXED_RECURRING);
  const [minQuantity, setMinQuantity] = useState(1);
  const [autoClose, setAutoClose] = useState(false);
  const [allowPause, setAllowPause] = useState(true);
  const [allowEarlyClose, setAllowEarlyClose] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [pl, pr] = await Promise.all([mockRepo.getPlans(), mockRepo.getProducts()]);
      setPlans(pl);
      setProducts(pr);
      if (pr.length > 0) setProductId(pr[0].id);
      setLoading(false);
    }
    load();
  }, [refreshKey]);

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find((p) => p.id === productId);
    if (!prod || !nickname) return;

    try {
      setSubmitting(true);
      await mockRepo.createPlan({
        productId: prod.id,
        productName: prod.name,
        nickname,
        currency: 'INR',
        unitAmount,
        billingInterval,
        billingIntervalCount: Number(billingIntervalCount),
        pricingModel,
        taxRatePercentage: '18.00',
        minQuantity: Number(minQuantity),
        autoClose,
        allowPause,
        allowEarlyClose,
        active: true,
      });
      setIsModalOpen(false);
      setNickname('');
      triggerRefresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#242f44] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              Billing Plans & Schedule Rules
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-[#151b28] border border-[#242f44] text-slate-300">
              {plans.length} Configured Plans
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Define daily, weekly, monthly, and yearly recurring periods, min-seat commitments, and contract closure behaviors.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<PlusCircle className="w-4 h-4" />}
          onClick={() => setIsModalOpen(true)}
        >
          Create Plan
        </Button>
      </div>

      {/* Grid of Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {plans.map((plan) => (
          <Card key={plan.id} surface="dark" className="border border-[#242f44] space-y-4">
            <div className="flex items-start justify-between gap-2 border-b border-[#242f44] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white tracking-tight">{plan.nickname}</h2>
                  {plan.active ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-800">
                      Active
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/60 text-rose-300 border border-rose-800">
                      Discontinued
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{plan.productName}</p>
              </div>

              <div className="text-right">
                <span className="text-lg font-extrabold font-mono text-[#fcee21]">
                  {formatMoney(plan.unitAmount, plan.currency)}
                </span>
                <span className="block text-[11px] font-mono text-slate-400 capitalize">
                  per {plan.billingInterval}
                </span>
              </div>
            </div>

            {/* Rule Summary */}
            <PlanRuleSummary plan={plan} />
          </Card>
        ))}
      </div>

      {/* Modal: Create Plan */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Billing Plan"
        description="Configure commercial recurrence intervals, seat thresholds, and lifecycle permissions."
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
              onClick={handleCreatePlan}
              isLoading={submitting}
            >
              Save Plan
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreatePlan} className="space-y-4">
          <Select
            label="Associated Catalog Product"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            options={products.map((p) => ({ value: p.id, label: `${p.name} (${p.type})` }))}
            required
          />

          <Input
            label="Plan Commercial Nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="e.g. Enterprise Dedicated VPC (Annual)"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MoneyInput
              label="Recurring Unit Amount"
              value={unitAmount}
              onChange={setUnitAmount}
              required
            />
            <Select
              label="Recurrence Interval"
              value={billingInterval}
              onChange={(e) => setBillingInterval(e.target.value as BillingInterval)}
              options={[
                { value: BillingInterval.MONTH, label: 'Monthly' },
                { value: BillingInterval.YEAR, label: 'Yearly (Annual)' },
                { value: BillingInterval.WEEK, label: 'Weekly' },
                { value: BillingInterval.DAY, label: 'Daily' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Minimum Contract Quantity (Commitment)"
              type="number"
              min={1}
              value={minQuantity}
              onChange={(e) => setMinQuantity(Number(e.target.value))}
              required
            />
            <Select
              label="Pricing Model Foundation"
              value={pricingModel}
              onChange={(e) => setPricingModel(e.target.value as PricingModel)}
              options={[
                { value: PricingModel.FIXED_RECURRING, label: 'Fixed Recurring' },
                { value: PricingModel.PER_UNIT, label: 'Per-Unit Seat Volume' },
              ]}
            />
          </div>

          <div className="p-3 rounded-lg bg-[#08090d] border border-[#242f44] space-y-2 text-xs">
            <span className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Lifecycle Transition Permissions
            </span>
            <label className="flex items-center gap-2 text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={allowPause}
                onChange={(e) => setAllowPause(e.target.checked)}
                className="rounded border-[#242f44] text-[#fcee21] focus:ring-[#fcee21]"
              />
              <span>Allow customer to pause subscription billing cycles</span>
            </label>
            <label className="flex items-center gap-2 text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={allowEarlyClose}
                onChange={(e) => setAllowEarlyClose(e.target.checked)}
                className="rounded border-[#242f44] text-[#fcee21] focus:ring-[#fcee21]"
              />
              <span>Allow authorized administrative early closure</span>
            </label>
            <label className="flex items-center gap-2 text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={autoClose}
                onChange={(e) => setAutoClose(e.target.checked)}
                className="rounded border-[#242f44] text-[#fcee21] focus:ring-[#fcee21]"
              />
              <span>Auto-close agreement at end of initial billing period (No auto-renew)</span>
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
}
