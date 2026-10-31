'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button, Input, Table, Modal, Card, Select } from '@brightloop/ui';
import { DiscountDTO } from '@/mocks/types';
import { mockRepo } from '@/mocks/repository';
import { useApp } from '@/lib/context';
import { useToast } from '@/lib/toast';
import { formatMoney, formatDate } from '@/lib/formatters';
import { DiscountType } from '@brightloop/shared-types';
import {
  PlusCircle,
  Percent,
  Shield,
  ShieldAlert,
  Tag,
  CheckCircle2,
  Copy,
  Check,
  TrendingDown,
  Sparkles,
} from 'lucide-react';
import { MoneyInput } from '@/components/domain/MoneyInput';

export default function DiscountsPage() {
  const { refreshKey, triggerRefresh, can, role } = useApp();
  const { success, error } = useToast();
  const [discounts, setDiscounts] = useState<DiscountDTO[]>([]);
  const [filterType, setFilterType] = useState<'ALL' | DiscountType>('ALL');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // New Discount Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<DiscountType>(DiscountType.PERCENTAGE);
  const [value, setValue] = useState('15');
  const [minPurchase, setMinPurchase] = useState('5000.00');
  const [maxUsageLimit, setMaxUsageLimit] = useState('100');
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

  const handleCopyCode = (promoCode: string) => {
    navigator.clipboard.writeText(promoCode);
    setCopiedCode(promoCode);
    success('Promo Code Copied', `Copied "${promoCode}" to clipboard.`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canMutateDiscounts) return;
    if (!code || !name) return;

    try {
      setSubmitting(true);
      const created = await mockRepo.createDiscount({
        code: code.toUpperCase().trim(),
        name,
        type,
        value,
        minPurchaseAmount: minPurchase,
        minQuantity: 1,
        maxUsageLimit: maxUsageLimit ? Number(maxUsageLimit) : undefined,
        active: true,
      });
      setIsModalOpen(false);
      setCode('');
      setName('');
      success('Discount Rule Created', `Code ${created.code} is now live and auto-qualifying.`);
      triggerRefresh();
    } catch (err: unknown) {
      error('Failed to create discount rule', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDiscounts = useMemo(() => {
    if (filterType === 'ALL') return discounts;
    return discounts.filter((d) => d.type === filterType);
  }, [discounts, filterType]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#242f44] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              Discount Rules &amp; Deductions
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#151b28] border border-[#242f44] text-[#fcee21]">
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
          <span className="text-slate-300">Governance Policy:</span>
          <span className="font-bold text-white">
            {canMutateDiscounts ? 'Full Administrative Mutation' : 'Restricted (Read-Only)'}
          </span>
        </div>
        <span className="text-[11px] text-slate-400">
          Source requirement: Discounts are admin-only and auto-apply
        </span>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2">
        {[
          { id: 'ALL', label: `All Rules (${discounts.length})` },
          {
            id: DiscountType.PERCENTAGE,
            label: `Percentage (${discounts.filter((d) => d.type === DiscountType.PERCENTAGE).length})`,
          },
          {
            id: DiscountType.FIXED_AMOUNT,
            label: `Fixed Amount (${discounts.filter((d) => d.type === DiscountType.FIXED_AMOUNT).length})`,
          },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilterType(f.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filterType === f.id
                ? 'bg-[#fcee21] text-black font-bold shadow-sm'
                : 'bg-[#151b28] text-slate-400 hover:text-white border border-[#242f44]'
            }`}
          >
            {f.label}
          </button>
        ))}
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
                <button
                  onClick={() => handleCopyCode(d.code)}
                  className="p-1 text-slate-400 hover:text-[#fcee21] transition-colors rounded hover:bg-[#1f293d]"
                  title="Copy Code"
                >
                  {copiedCode === d.code ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
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
            header: 'Redemption Progress',
            cell: (d) => {
              const max = d.maxUsageLimit || 100;
              const pct = Math.min(100, Math.round((d.usageCount / max) * 100));
              return (
                <div className="space-y-1 w-32">
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>{d.usageCount} used</span>
                    <span>{d.maxUsageLimit ? `/ ${d.maxUsageLimit}` : 'unlimited'}</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#1b2333] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#fcee21] rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            },
          },
          {
            header: 'Status',
            cell: (d) => (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-800">
                Active &amp; Auto-Apply
              </span>
            ),
          },
        ]}
        data={filteredDiscounts}
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
          <div className="grid grid-cols-2 gap-3">
            <MoneyInput
              label="Min Qualifying Subtotal"
              value={minPurchase}
              onChange={setMinPurchase}
              hint="Order subtotal must meet or exceed this amount"
            />
            <Input
              label="Max Usage Limit"
              type="number"
              value={maxUsageLimit}
              onChange={(e) => setMaxUsageLimit(e.target.value)}
              placeholder="100"
              hint="Maximum redemptions allowed"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
