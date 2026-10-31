'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button, Input, Table, Modal, Card, Select, Textarea } from '@brightloop/ui';
import { ProductDTO, ProductVariantDTO } from '@/mocks/types';
import { mockRepo } from '@/mocks/repository';
import { useApp } from '@/lib/context';
import { useToast } from '@/lib/toast';
import { formatMoney } from '@/lib/formatters';
import { ProductType } from '@brightloop/shared-types';
import {
  PlusCircle,
  Package,
  Layers,
  ShieldCheck,
  Eye,
  EyeOff,
  Search,
  Sparkles,
  TrendingUp,
  Tag,
  Copy,
  Check,
} from 'lucide-react';
import Link from 'next/link';
import { MoneyInput } from '@/components/domain/MoneyInput';

export default function ProductsPage() {
  const { refreshKey, triggerRefresh, can } = useApp();
  const { success, error } = useToast();
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | ProductType>('ALL');
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<ProductType>(ProductType.SOFTWARE);
  const [salesPrice, setSalesPrice] = useState('10000.00');
  const [costPrice, setCostPrice] = useState('2500.00');
  const [notes, setNotes] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Add Variant Modal State
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [variantName, setVariantName] = useState('');
  const [attrName, setAttrName] = useState('Tier');
  const [attrVal, setAttrVal] = useState('Dedicated VPC');
  const [priceAdj, setPriceAdj] = useState('5000.00');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await mockRepo.getProducts();
      setProducts(data);
      setLoading(false);
    }
    load();
  }, [refreshKey]);

  const handleCopySku = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    success('Product ID Copied', `Copied ID ${id}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    try {
      setSubmitting(true);
      const created = await mockRepo.createProduct({
        name,
        type,
        salesPrice,
        costPrice,
        notes: notes.trim() || undefined,
        description: description.trim() || undefined,
        active: true,
      });
      setIsProductModalOpen(false);
      setName('');
      setNotes('');
      setDescription('');
      success('Product Cataloged', `${created.name} added to live commercial catalog.`);
      triggerRefresh();
    } catch (err: unknown) {
      error('Failed to create product', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !variantName) return;
    try {
      setSubmitting(true);
      await mockRepo.addProductVariant(selectedProductId, {
        name: variantName,
        attributeName: attrName,
        attributeValue: attrVal,
        priceAdjustment: priceAdj,
      });
      setSelectedProductId(null);
      setVariantName('');
      success('Variant Configured', `Tier variant "${variantName}" added with price adjustment.`);
      triggerRefresh();
    } catch (err: unknown) {
      error('Failed to add variant', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  const canViewCostPrice = can('cost_price:view');

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(search.toLowerCase())) ||
        p.id.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === 'ALL' || p.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [products, search, typeFilter]);

  const counts = useMemo(() => {
    return {
      all: products.length,
      software: products.filter((p) => p.type === ProductType.SOFTWARE).length,
      addon: products.filter((p) => p.type === ProductType.ADD_ON).length,
      physical: products.filter((p) => p.type === ProductType.PHYSICAL).length,
    };
  }, [products]);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#242f44] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              Product Catalog &amp; Variants
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#151b28] border border-[#242f44] text-[#fcee21]">
              {products.length} Products
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Define recurring software modules, add-ons, physical hardware, and deployment tier price adjustments.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<PlusCircle className="w-4 h-4" />}
          onClick={() => setIsProductModalOpen(true)}
        >
          Add Product
        </Button>
      </div>

      {/* Role privilege notice */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-[#0d111a] border border-[#242f44] text-xs">
        <div className="flex items-center gap-2">
          {canViewCostPrice ? (
            <Eye className="w-4 h-4 text-[#fcee21]" />
          ) : (
            <EyeOff className="w-4 h-4 text-slate-500" />
          )}
          <span className="text-slate-300">
            Internal Cost Price Visibility:
          </span>
          <span className="font-bold text-white">
            {canViewCostPrice ? 'Visible (Admin privileged)' : 'Hidden (Staff view)'}
          </span>
        </div>
        <span className="text-[11px] text-slate-400">
          Source requirement: Separate commercial price and internal cost display
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search products by title or keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftAddon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: `All (${counts.all})` },
            { id: ProductType.SOFTWARE, label: `Software (${counts.software})` },
            { id: ProductType.ADD_ON, label: `Add-Ons (${counts.addon})` },
            { id: ProductType.PHYSICAL, label: `Physical (${counts.physical})` },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTypeFilter(t.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                typeFilter === t.id
                  ? 'bg-[#fcee21] text-black font-bold shadow-sm'
                  : 'bg-[#151b28] text-slate-400 hover:text-white border border-[#242f44]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Products list cards */}
      <div className="space-y-4">
        {filteredProducts.length === 0 ? (
          <div className="p-8 text-center text-slate-400 rounded-xl bg-[#0c1017] border border-[#242f44]">
            No products match your search or category filter.
          </div>
        ) : (
          filteredProducts.map((prod) => {
            const marginAmount = Number(prod.salesPrice) - Number(prod.costPrice);
            const marginPct =
              Number(prod.salesPrice) > 0
                ? Math.round((marginAmount / Number(prod.salesPrice)) * 100)
                : 0;

            return (
              <Card key={prod.id} surface="dark" className="border border-[#242f44] space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#242f44] pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-white tracking-tight">{prod.name}</h2>
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-mono font-bold bg-[#151b28] border border-[#242f44] text-[#fcee21]">
                        {prod.type}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-800">
                        Active
                      </span>
                      <button
                        onClick={() => handleCopySku(prod.id)}
                        className="flex items-center gap-1 text-[11px] font-mono text-slate-500 hover:text-slate-300"
                        title="Copy Product ID"
                      >
                        {copiedId === prod.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{prod.id}</span>
                      </button>
                    </div>
                    {prod.description && (
                      <p className="text-xs text-slate-300">{prod.description}</p>
                    )}
                    {prod.notes && (
                      <p className="text-[11px] text-slate-400 italic">Notes: {prod.notes}</p>
                    )}
                  </div>

                  {/* Pricing badges */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Base Commercial Price
                      </span>
                      <span className="text-base font-extrabold font-mono text-white">
                        {formatMoney(prod.salesPrice)}
                      </span>
                    </div>

                    {canViewCostPrice && (
                      <div className="text-right pl-3 border-l border-[#242f44]">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Internal Cost Price
                        </span>
                        <span className="text-sm font-bold font-mono text-slate-300">
                          {formatMoney(prod.costPrice)}
                        </span>
                        <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                          {marginPct}% Margin ({formatMoney(marginAmount)})
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Variants table */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                      <Layers className="w-3.5 h-3.5 text-[#fcee21]" />
                      <span>Configured Variants ({prod.variants.length})</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<PlusCircle className="w-3 h-3" />}
                      onClick={() => setSelectedProductId(prod.id)}
                    >
                      Add Variant
                    </Button>
                  </div>

                  {prod.variants.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2">
                      No variants defined (Standard base pricing applies).
                    </p>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-[#242f44] bg-[#08090d]">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-[#242f44] text-slate-400 font-semibold">
                            <th className="py-2 px-3">Variant Name</th>
                            <th className="py-2 px-3">Attribute</th>
                            <th className="py-2 px-3">Attribute Value</th>
                            <th className="py-2 px-3 text-right">Price Adjustment</th>
                            <th className="py-2 px-3 text-right">Net Price Preview</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1b2333]">
                          {prod.variants.map((v) => {
                            const netPrice = Number(prod.salesPrice) + Number(v.priceAdjustment);
                            return (
                              <tr key={v.id} className="text-slate-200 hover:bg-[#111726]/50">
                                <td className="py-2.5 px-3 font-semibold text-white">{v.name}</td>
                                <td className="py-2.5 px-3 text-slate-400">{v.attributeName}</td>
                                <td className="py-2.5 px-3">{v.attributeValue}</td>
                                <td className="py-2.5 px-3 text-right font-mono">
                                  {Number(v.priceAdjustment) > 0
                                    ? `+${formatMoney(v.priceAdjustment)}`
                                    : formatMoney(v.priceAdjustment)}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-bold text-[#fcee21]">
                                  {formatMoney(netPrice)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Modal: Add Product */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title="Add Catalog Product"
        description="Register a core software license, add-on module, or physical hardware."
        maxWidth="lg"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsProductModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateProduct}
              isLoading={submitting}
            >
              Create Product
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateProduct} className="space-y-4">
          <Input
            label="Product Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Real-Time Telemetry Addon"
            required
          />
          <Select
            label="Product Classification"
            value={type}
            onChange={(e) => setType(e.target.value as ProductType)}
            options={[
              { value: ProductType.SOFTWARE, label: 'SOFTWARE — Core Recurring License' },
              { value: ProductType.ADD_ON, label: 'ADD_ON — Modular Feature Extension' },
              { value: ProductType.PHYSICAL, label: 'PHYSICAL — Physical Shipped Hardware' },
            ]}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MoneyInput
              label="Commercial Sales Price (INR)"
              value={salesPrice}
              onChange={setSalesPrice}
              required
            />
            {canViewCostPrice && (
              <MoneyInput
                label="Internal Cost Price (INR)"
                value={costPrice}
                onChange={setCostPrice}
                hint="Used for internal margin analysis (Admin privileged)"
              />
            )}
          </div>
          <Input
            label="Product Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief marketing and commercial scope summary..."
          />
          <Textarea
            label="Internal Operational Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Technical dependencies, fulfillment guidelines, or license requirements..."
          />
        </form>
      </Modal>

      {/* Modal: Add Variant */}
      <Modal
        isOpen={!!selectedProductId}
        onClose={() => setSelectedProductId(null)}
        title={`Add Variant to ${selectedProduct?.name || 'Product'}`}
        description="Define deployment tiers, user pack sizes, or storage increments."
        maxWidth="md"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedProductId(null)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddVariant}
              isLoading={submitting}
            >
              Add Variant
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddVariant} className="space-y-4">
          <Input
            label="Variant Name"
            value={variantName}
            onChange={(e) => setVariantName(e.target.value)}
            placeholder="e.g. Multi-Region High-Availability"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Attribute Name"
              value={attrName}
              onChange={(e) => setAttrName(e.target.value)}
              placeholder="e.g. Hosting"
              required
            />
            <Input
              label="Attribute Value"
              value={attrVal}
              onChange={(e) => setAttrVal(e.target.value)}
              placeholder="e.g. Dedicated AWS VPC"
              required
            />
          </div>
          <MoneyInput
            label="Price Adjustment relative to base (INR)"
            value={priceAdj}
            onChange={setPriceAdj}
            hint="Use positive amounts for add-on surcharges or 0.00 for no change"
          />
        </form>
      </Modal>
    </div>
  );
}
