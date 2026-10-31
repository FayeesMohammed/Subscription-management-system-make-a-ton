'use client';

import React, { useState, useEffect } from 'react';
import { Button, Input, Table, Modal, Card, Select } from '@brightloop/ui';
import { QuotationTemplateDTO, ProductDTO } from '@/mocks/types';
import { mockRepo } from '@/mocks/repository';
import { useApp } from '@/lib/context';
import { formatMoney } from '@/lib/formatters';
import { PlusCircle, FileSpreadsheet, Clock, ArrowRight, Layers } from 'lucide-react';
import Link from 'next/link';

export default function TemplatesPage() {
  const { refreshKey, triggerRefresh } = useApp();
  const [templates, setTemplates] = useState<QuotationTemplateDTO[]>([]);
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [loading, setLoading] = useState(true);

  // New Template Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [validDays, setValidDays] = useState(30);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [tmpls, prods] = await Promise.all([
        mockRepo.getTemplates(),
        mockRepo.getProducts(),
      ]);
      setTemplates(tmpls);
      setProducts(prods);
      if (prods.length > 0) setSelectedProductId(prods[0].id);
      setLoading(false);
    }
    load();
  }, [refreshKey]);

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find((p) => p.id === selectedProductId);
    if (!name || !prod) return;

    try {
      setSubmitting(true);
      await mockRepo.createTemplate({
        name,
        description: description.trim() || undefined,
        validForDays: Number(validDays),
        lines: [
          {
            productId: prod.id,
            productName: prod.name,
            quantity: 1,
            unitPrice: prod.salesPrice,
          },
        ],
      });
      setIsModalOpen(false);
      setName('');
      setDescription('');
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
              Quotation Templates Library
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-[#151b28] border border-[#242f44] text-slate-300">
              {templates.length} Templates
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Standardize sales proposals with pre-packaged line items, terms, and default validity windows.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<PlusCircle className="w-4 h-4" />}
          onClick={() => setIsModalOpen(true)}
        >
          New Template
        </Button>
      </div>

      {/* Grid of Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((tmpl) => (
          <Card key={tmpl.id} surface="dark" className="border border-[#242f44] space-y-4">
            <div className="flex items-start justify-between gap-2 border-b border-[#242f44] pb-3">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">{tmpl.name}</h2>
                {tmpl.description && (
                  <p className="text-xs text-slate-300 mt-1">{tmpl.description}</p>
                )}
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#151b28] border border-[#242f44] text-xs font-mono text-[#fcee21] shrink-0">
                <Clock className="w-3.5 h-3.5" />
                <span>{tmpl.validForDays} Days Validity</span>
              </div>
            </div>

            {/* Included Line Items */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Pre-Configured Line Items ({tmpl.lines.length})
              </span>
              <div className="space-y-1.5">
                {tmpl.lines.map((line, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded bg-[#08090d] border border-[#242f44] text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#fcee21]" />
                      <span className="font-semibold text-white">{line.productName}</span>
                      {line.variantName && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          ({line.variantName})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 font-mono">Qty: {line.quantity}</span>
                      <span className="font-mono font-bold text-white">
                        {formatMoney(line.unitPrice)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-[#242f44] flex justify-end">
              <Link href="/sales/quotes">
                <Button variant="secondary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  Use in Quote Composer
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal: New Template */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Author Quotation Template"
        description="Save default product combinations and commercial validity parameters."
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
              onClick={handleCreateTemplate}
              isLoading={submitting}
            >
              Save Template
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateTemplate} className="space-y-4">
          <Input
            label="Template Title"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Enterprise VPC Onboarding Bundle"
            required
          />
          <Input
            label="Commercial Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Scope of services and terms summary."
          />
          <Input
            label="Default Quotation Validity (Days)"
            type="number"
            min={1}
            max={365}
            value={validDays}
            onChange={(e) => setValidDays(Number(e.target.value))}
            required
            hint="Number of calendar days before quotation expires if unaccepted"
          />
          <Select
            label="Initial Core Product"
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            options={products.map((p) => ({ value: p.id, label: `${p.name} (${formatMoney(p.salesPrice)})` }))}
            required
          />
        </form>
      </Modal>
    </div>
  );
}
