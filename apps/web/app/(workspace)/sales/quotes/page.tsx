'use client';

import React, { useState, useEffect } from 'react';
import { Button, Input, Table, Modal, Card, Select } from '@brightloop/ui';
import { CustomerDTO, PlanDTO, ProductDTO, SubscriptionDTO, QuotationTemplateDTO, DiscountDTO } from '@/mocks/types';
import { mockRepo } from '@/mocks/repository';
import { useApp } from '@/lib/context';
import { useToast } from '@/lib/toast';
import { formatMoney, formatDate } from '@/lib/formatters';
import { SubscriptionStatus } from '@brightloop/shared-types';
import { PlusCircle, Send, Clock, AlertTriangle, CheckCircle, FileText, Check, Tag } from 'lucide-react';
import Link from 'next/link';
import { PricingSummary } from '@/components/domain/PricingSummary';
import { SubscriptionStatusBadge } from '@/components/domain/SubscriptionStatusBadge';
import Decimal from 'decimal.js';

export default function QuotesPage() {
  const { refreshKey, triggerRefresh, user } = useApp();
  const { success, error } = useToast();
  const [quotes, setQuotes] = useState<SubscriptionDTO[]>([]);
  const [customers, setCustomers] = useState<CustomerDTO[]>([]);
  const [plans, setPlans] = useState<PlanDTO[]>([]);
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [templates, setTemplates] = useState<QuotationTemplateDTO[]>([]);
  const [discounts, setDiscounts] = useState<DiscountDTO[]>([]);
  const [loading, setLoading] = useState(true);

  // Composer Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedPriceId, setSelectedPriceId] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountDTO | null>(null);
  const [issueDirectly, setIssueDirectly] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [subs, custs, pls, prods, tmpls, discs] = await Promise.all([
        mockRepo.getSubscriptions(),
        mockRepo.getCustomers(),
        mockRepo.getPlans(),
        mockRepo.getProducts(),
        mockRepo.getTemplates(),
        mockRepo.getDiscounts(),
      ]);

      const quoteList = subs.filter(
        (s) =>
          s.status === SubscriptionStatus.QUOTATION ||
          s.status === SubscriptionStatus.DRAFT,
      );

      setQuotes(quoteList);
      setCustomers(custs);
      setPlans(pls);
      setProducts(prods);
      setTemplates(tmpls);
      setDiscounts(discs);

      if (custs.length > 0) setSelectedCustomerId(custs[0].id);
      if (pls.length > 0) setSelectedPriceId(pls[0].id);

      setLoading(false);
    }
    load();
  }, [refreshKey]);

  // Selected plan & product
  const currentPlan = plans.find((p) => p.id === selectedPriceId);
  const currentProduct = currentPlan
    ? products.find((p) => p.id === currentPlan.productId)
    : undefined;

  // Real-time discount code matching
  useEffect(() => {
    const code = discountCode.trim().toUpperCase();
    if (!code) {
      setAppliedDiscount(null);
      return;
    }
    const match = discounts.find((d) => d.code === code && d.active);
    setAppliedDiscount(match || null);
  }, [discountCode, discounts]);

  // Validate constraints
  useEffect(() => {
    if (currentPlan && quantity < currentPlan.minQuantity) {
      setValidationWarning(
        `Selected plan "${currentPlan.nickname}" mandates a minimum commitment of ${currentPlan.minQuantity} unit(s).`,
      );
    } else if (currentPlan && !currentPlan.active) {
      setValidationWarning(
        `Warning: Selected plan is discontinued or inactive.`,
      );
    } else {
      setValidationWarning(null);
    }
  }, [currentPlan, quantity]);

  // Dynamic pricing breakdown
  const basePrice = currentPlan ? new Decimal(currentPlan.unitAmount) : new Decimal(0);
  let variantAdj = new Decimal(0);
  if (currentProduct && selectedVariantId) {
    const v = currentProduct.variants.find((vr) => vr.id === selectedVariantId);
    if (v) variantAdj = new Decimal(v.priceAdjustment);
  }

  const effectiveUnit = basePrice.plus(variantAdj);
  const subtotal = effectiveUnit.times(quantity);

  let discountAmt = new Decimal(0);
  if (appliedDiscount) {
    if (appliedDiscount.type === 'PERCENTAGE') {
      discountAmt = subtotal.times(new Decimal(appliedDiscount.value).dividedBy(100));
    } else {
      discountAmt = new Decimal(appliedDiscount.value);
    }
  }

  const netSubtotal = subtotal.minus(discountAmt).greaterThan(0)
    ? subtotal.minus(discountAmt)
    : new Decimal(0);
  const taxAmount = netSubtotal.times(0.18);
  const totalAmount = netSubtotal.plus(taxAmount);

  const handleCreateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !selectedPriceId) return;

    try {
      setSubmitting(true);
      const newSub = await mockRepo.createSubscriptionDraft(
        {
          customerId: selectedCustomerId,
          priceId: selectedPriceId,
          variantId: selectedVariantId || undefined,
          quantity: Number(quantity),
          discountCode: discountCode.trim() || undefined,
          asQuotation: issueDirectly,
        },
        `${user.name} (${user.role})`,
      );
      setIsModalOpen(false);
      success(
        issueDirectly ? 'Quotation Issued Successfully' : 'Draft Proposal Saved',
        `Contract ${newSub.subscriptionNumber} created with 30-day commercial validity.`,
      );
      triggerRefresh();
    } catch (err: unknown) {
      error('Failed to create proposal', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1f283d] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-white">
              Commercial Quotations
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#141a27] border border-[#222c3f] text-[#fcee21]">
              {quotes.length} Open Proposals
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Catalog-to-quotation workflow with automated term calculations, validity expiry, and customer acceptance.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<PlusCircle className="w-4 h-4" />}
          onClick={() => setIsModalOpen(true)}
        >
          Draft / Issue Quotation
        </Button>
      </div>

      {/* Table of Quotes */}
      <Table<SubscriptionDTO>
        columns={[
          {
            header: 'Quotation #',
            cell: (q) => (
              <div className="space-y-0.5">
                <Link
                  href={`/sales/subscriptions/${q.id}`}
                  className="font-bold text-white hover:text-[#fcee21] font-mono text-xs flex items-center gap-1.5 group"
                >
                  <Send className="w-3.5 h-3.5 text-[#fcee21] group-hover:translate-x-0.5 transition-transform" />
                  <span>{q.subscriptionNumber}</span>
                </Link>
                <p className="text-[11px] text-slate-400">{q.customerName}</p>
              </div>
            ),
          },
          {
            header: 'Commercial State',
            cell: (q) => <SubscriptionStatusBadge status={q.status} size="sm" />,
          },
          {
            header: 'Plan & Commitment',
            cell: (q) => (
              <div>
                <p className="text-xs font-semibold text-slate-200">{q.planNickname}</p>
                <p className="text-[11px] text-slate-400 font-mono">
                  {q.quantity} unit(s) • /{q.billingInterval}
                </p>
              </div>
            ),
          },
          {
            header: 'Validity Expiry',
            cell: (q) => {
              if (!q.validUntil) return <span className="text-xs text-slate-500 font-mono">Draft (No expiry)</span>;
              const isUrgent = new Date(q.validUntil).getTime() - Date.now() < 24 * 3600 * 1000;
              return (
                <div className="flex items-center gap-1.5">
                  <Clock className={`w-3.5 h-3.5 ${isUrgent ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`} />
                  <span
                    className={`font-mono text-xs ${
                      isUrgent ? 'text-rose-300 font-bold' : 'text-slate-300'
                    }`}
                  >
                    {formatDate(q.validUntil)}
                    {isUrgent && ' (<2h Urgency)'}
                  </span>
                </div>
              );
            },
          },
          {
            header: 'Total Value',
            align: 'right',
            cell: (q) => (
              <span className="font-mono font-bold text-xs text-white">
                {formatMoney(q.totalAmount, q.currency)}
              </span>
            ),
          },
          {
            header: 'Actions',
            align: 'right',
            cell: (q) => (
              <Link href={`/sales/subscriptions/${q.id}`}>
                <Button variant="outline" size="sm">
                  Review &amp; Advance
                </Button>
              </Link>
            ),
          },
        ]}
        data={quotes}
        keyExtractor={(q) => q.id}
        isLoading={loading}
        emptyMessage="No pending quotations found. Click 'Draft / Issue Quotation' to begin."
      />

      {/* Modal: Quote Composer */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Quotation Composer"
        description="Select customer, configure recurring plan, variants, and validate commercial terms."
        maxWidth="2xl"
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
              onClick={handleCreateQuote}
              isLoading={submitting}
            >
              {issueDirectly ? 'Issue Formal Quotation' : 'Save as Draft'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateQuote} className="space-y-4">
          {validationWarning && (
            <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-800 text-xs text-amber-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{validationWarning}</span>
            </div>
          )}

          {/* Customer Selector */}
          <Select
            label="Customer Commercial Account"
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            options={customers.map((c) => ({
              value: c.id,
              label: `${c.name} (${c.taxNumber || c.email})`,
            }))}
            required
          />

          {/* Plan Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Recurring Plan"
              value={selectedPriceId}
              onChange={(e) => {
                setSelectedPriceId(e.target.value);
                setSelectedVariantId('');
              }}
              options={plans.map((p) => ({
                value: p.id,
                label: `${p.nickname} — ${formatMoney(p.unitAmount)}/${p.billingInterval}`,
              }))}
              required
            />

            {/* Variant Selector */}
            <Select
              label="Deployment Variant / Tier Adjustment"
              value={selectedVariantId}
              onChange={(e) => setSelectedVariantId(e.target.value)}
              options={[
                { value: '', label: 'Default / Standard Instance (+₹0)' },
                ...(currentProduct
                  ? currentProduct.variants.map((v) => ({
                      value: v.id,
                      label: `${v.name} (+${formatMoney(v.priceAdjustment)})`,
                    }))
                  : []),
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Commitment Quantity (Units)"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              required
            />
            <div>
              <Input
                label="Promotional Discount Code"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                placeholder="e.g. LAUNCH2026 or FLAT5000"
              />
              {appliedDiscount && (
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold font-mono">
                  <Check className="w-3.5 h-3.5" />
                  <span>
                    Valid: {appliedDiscount.name} ({appliedDiscount.type === 'PERCENTAGE' ? `${appliedDiscount.value}%` : `₹${appliedDiscount.value}`} off)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Live Pricing Breakdown Preview */}
          <PricingSummary
            subtotal={subtotal.toFixed(2)}
            variantAdjustment={variantAdj.times(quantity).toFixed(2)}
            discountAmount={discountAmt.toFixed(2)}
            discountCode={appliedDiscount ? appliedDiscount.code : undefined}
            taxAmount={taxAmount.toFixed(2)}
            totalAmount={totalAmount.toFixed(2)}
            currency="INR"
            compact
          />

          {/* Direct Issue Checkbox */}
          <label className="flex items-center gap-2 p-3 rounded-xl bg-[#0c1017] border border-[#1f283d] cursor-pointer text-xs text-slate-200">
            <input
              type="checkbox"
              checked={issueDirectly}
              onChange={(e) => setIssueDirectly(e.target.checked)}
              className="rounded border-[#242f44] text-[#fcee21] focus:ring-[#fcee21]"
            />
            <span>
              Issue formal quotation immediately with 30-day validity (Advances status to QUOTATION)
            </span>
          </label>
        </form>
      </Modal>
    </div>
  );
}
