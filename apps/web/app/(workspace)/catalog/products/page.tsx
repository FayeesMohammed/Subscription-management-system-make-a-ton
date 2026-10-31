'use client';

import React, { useState, useEffect } from 'react';
import { Button, Input, Table, Modal, Card, Select, Textarea } from '@brightloop/ui';
import { ProductDTO, ProductVariantDTO } from '@/mocks/types';
import { mockRepo } from '@/mocks/repository';
import { useApp } from '@/lib/context';
import { formatMoney } from '@/lib/formatters';
import { ProductType } from '@brightloop/shared-types';
import { PlusCircle, Package, Layers, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { MoneyInput } from '@/components/domain/MoneyInput';

export default function ProductsPage() {
  const { refreshKey, triggerRefresh, can } = useApp();
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    try {
      setSubmitting(true);
      await mockRepo.createProduct({
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
      triggerRefresh();
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
      triggerRefresh();
    } finally {
      setSubmitting(false);
    }
  };

  const canViewCostPrice = can('cost_price:view');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#242f44] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              Product Catalog & Variants
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-[#151b28] border border-[#242f44] text-slate-300">
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

      {/* Products list cards */}
      <div className="space-y-4">
        {products.map((prod) => (
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
                    <span className="block text-[10px] text-emerald-400 font-mono">
                      Margin: {formatMoney(Number(prod.salesPrice) - Number(prod.costPrice))}
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
                          <tr key={v.id} className="text-slate-200">
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
        ))}
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
            {canViewCostPrice ? (
              <MoneyInput
                label="Internal Cost Price (Admin Only)"
                value={costPrice}
                onChange={setCostPrice}
                required
              />
            ) : (
              <div className="text-xs text-slate-400 p-2">
                Cost price is restricted to TENANT_ADMIN.
              </div>
            )}
          </div>
          <Input
            label="Short Commercial Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="High-frequency telemetry logging engine."
          />
          <Textarea
            label="Internal Operational Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Deployment details, infrastructure dependencies, SLA specifics."
          />
        </form>
      </Modal>

      {/* Modal: Add Variant */}
      <Modal
        isOpen={!!selectedProductId}
        onClose={() => setSelectedProductId(null)}
        title="Add Product Variant & Adjustment"
        description="Configure tiered instances with positive or negative price adjustment."
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
              Save Variant
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddVariant} className="space-y-4">
          <Input
            label="Variant Name"
            value={variantName}
            onChange={(e) => setVariantName(e.target.value)}
            placeholder="e.g. Dedicated AWS VPC Instance"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Attribute Name"
              value={attrName}
              onChange={(e) => setAttrName(e.target.value)}
              placeholder="e.g. Tier / Region"
              required
            />
            <Input
              label="Attribute Value"
              value={attrVal}
              onChange={(e) => setAttrVal(e.target.value)}
              placeholder="e.g. Asia-South Dedicated"
              required
            />
          </div>
          <MoneyInput
            label="Price Adjustment (+ / - Amount)"
            value={priceAdj}
            onChange={setPriceAdj}
            required
            hint="Added to base sales price for this variant"
          />
        </form>
      </Modal>
    </div>
  );
}
