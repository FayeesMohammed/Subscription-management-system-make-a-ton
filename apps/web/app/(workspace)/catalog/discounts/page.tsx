'use client';

import React, { useState, useEffect } from 'react';
import { Button, Input, Table, Modal, Card, Select } from '@brightloop/ui';
import { DiscountDTO } from '@/mocks/types';
import { mockRepo } from '@/mocks/repository';
import { useApp } from '@/lib/context';
import { formatMoney, formatDate } from '@/lib/formatters';
import { DiscountType } from '@brightloop/shared-types';
import { PlusCircle, Percent, Shield, ShieldAlert, Tag, CheckCircle2 } from 'lucide-react';
import { MoneyInput } from '@/components/domain/MoneyInput';

export default function DiscountsPage() {
  const { refreshKey, triggerRefresh, can, role } = useApp();
  const [discounts, setDiscounts] = useState<DiscountDTO[]>([]);
  const [loading, setLoading] = useState(true);

  // New Discount Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<DiscountType>(DiscountType.PERCENTAGE);
  const [value, setValue] = useState('15');
  const [minPurchase, setMinPurchase] = useState('5000.00');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await mockRepo.getDiscounts();
      setDiscounts(data);
      setLoading(false);
    }
    load();
  }, [refreshKey]);

  const canMutateDiscounts = can('discount:write');

  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canMutateDiscounts) return;
    if (!code || !name) return;

    try {
      setSubmitting(true);
      await mockRepo.createDiscount({
        code: code.toUpperCase().trim(),
        name,
        type,
        value,
        minPurchaseAmount: minPurchase,
        minQuantity: 1,
        active: true,
      });
      setIsModalOpen(false);
      setCode('');
      setName('');
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
              Discount Rules & Deductions
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-[#151b28] border border-[#242f44] text-slate-300">
              {discounts.length} Rules
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Define promotional coupon codes, percentage volume deductions, and minimum purchase thresholds.
          </p>
        </div>

        {canMutateDiscounts ? (
          <Button
            variant="primary"
            size="sm"
            leftIcon={<PlusCircle className="w-4 h-4" />}
            onClick={() => setIsModalOpen(true)}
          >
            Create Discount Rule
          </Button>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#151b28] border border-[#242f44] text-xs text-slate-400">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Read-only policy (Admin privilege required to add or edit discount rules)</span>
          </div>
        )}
      </div>

      {/* Admin Governance Banner */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-[#0d111a] border border-[#242f44] text-xs">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#fcee21]" />
          <span className="text-slate-300">
            Governance Policy:
          </span>
          <span className="font-bold text-white">
            {canMutateDiscounts ? 'Full Administrative Mutation' : 'Restricted (Read-Only)'}
          </span>
        </div>
        <span className="text-[11px] text-slate-400">
          Source requirement: Discounts are admin-only and auto-apply
        </span>
      </div>

      {/* Discounts Table */}
      <Table<DiscountDTO>
        columns={[
          {
            header: 'Discount Code',
            cell: (d) => (
              <div className="flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-[#fcee21]" />
                <span className="font-mono font-bold text-white text-xs px-2 py-0.5 rounded bg-[#151b28] border border-[#242f44]">
                  {d.code}
                </span>
              </div>
            ),
          },
          {
            header: 'Rule Description',
            cell: (d) => (
              <div>
                <p className="font-semibold text-slate-200 text-xs">{d.name}</p>
                <p className="text-[11px] text-slate-400">
                  Min purchase: {formatMoney(d.minPurchaseAmount)}
                </p>
              </div>
            ),
          },
          {
            header: 'Deduction Value',
            cell: (d) => (
              <span className="font-mono font-bold text-emerald-400 text-xs">
                {d.type === DiscountType.PERCENTAGE ? `${d.value}% Off` : `-${formatMoney(d.value)}`}
              </span>
            ),
          },
          {
            header: 'Usage Ledger',
            cell: (d) => (
              <span className="font-mono text-xs text-slate-300">
                {d.usageCount} {d.maxUsageLimit ? `/ ${d.maxUsageLimit}` : 'redemptions'}
              </span>
            ),
          },
          {
            header: 'Status',
            cell: (d) => (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-800">
                Active & Applicable
              </span>
            ),
          },
        ]}
        data={discounts}
        keyExtractor={(d) => d.id}
        isLoading={loading}
      />

      {/* Modal: Create Discount (Admin only) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Author New Commercial Discount Rule"
        description="Admin governance: Define coupon code parameters and purchase thresholds."
        maxWidth="md"
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
              onClick={handleCreateDiscount}
              isLoading={submitting}
            >
              Save Discount Rule
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateDiscount} className="space-y-4">
          <Input
            label="Promo / Voucher Code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. VIP2026"
            required
            hint="Auto-capitalized alphanumeric promo string"
          />
          <Input
            label="Rule Name / Commercial Purpose"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Annual VIP 25% Enterprise Waiver"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Discount Model"
              value={type}
              onChange={(e) => setType(e.target.value as DiscountType)}
              options={[
                { value: DiscountType.PERCENTAGE, label: 'Percentage (%) Deduction' },
                { value: DiscountType.FIXED_AMOUNT, label: 'Fixed Amount (INR) Waiver' },
              ]}
            />
            <Input
              label={type === DiscountType.PERCENTAGE ? 'Percentage Value (%)' : 'Fixed Amount (INR)'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
            />
          </div>
          <MoneyInput
            label="Minimum Qualifying Purchase Amount"
            value={minPurchase}
            onChange={setMinPurchase}
            hint="Order subtotal must meet or exceed this amount to unlock discount"
          />
        </form>
      </Modal>
    </div>
  );
}
