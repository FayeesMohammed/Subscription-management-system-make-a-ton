'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button, Card, Table, Alert } from '@brightloop/ui';
import { CustomerDTO, SubscriptionDTO, InvoiceDTO } from '@/mocks/types';
import { mockRepo } from '@/mocks/repository';
import { useApp } from '@/lib/context';
import { formatMoney, formatDate } from '@/lib/formatters';
import { SubscriptionStatusBadge } from '@/components/domain/SubscriptionStatusBadge';
import { InvoiceStatusBadge } from '@/components/domain/InvoiceStatusBadge';
import { ArrowLeft, Building2, Mail, Phone, MapPin, Receipt, PlusCircle } from 'lucide-react';
import Link from 'next/link';

export default function CustomerDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { refreshKey } = useApp();

  const [customer, setCustomer] = useState<CustomerDTO | null>(null);
  const [subscriptions, setSubscriptions] = useState<SubscriptionDTO[]>([]);
  const [invoices, setInvoices] = useState<InvoiceDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const c = await mockRepo.getCustomerById(id);
      if (c) {
        setCustomer(c);
        const subs = await mockRepo.getSubscriptions(c.id);
        const invs = await mockRepo.getInvoices(c.id);
        setSubscriptions(subs);
        setInvoices(invs);
      }
      setLoading(false);
    }
    load();
  }, [id, refreshKey]);

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading customer account...</div>;
  }

  if (!customer) {
    return (
      <div className="space-y-4">
        <Link href="/customers">
          <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Directory
          </Button>
        </Link>
        <Alert variant="error" title="Customer Not Found">
          No customer record exists with ID {id}.
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#242f44] pb-5">
        <div className="space-y-1">
          <Link
            href="/customers"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#fcee21] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Customer Directory</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-white">{customer.name}</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#151b28] border border-[#242f44] text-[#fcee21]">
              {customer.currency}
            </span>
          </div>
        </div>

        <Link href="/sales/quotes">
          <Button variant="primary" size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
            Draft Quote for Customer
          </Button>
        </Link>
      </div>

      {/* Profile & Tax Details Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card surface="dark" className="p-4 space-y-2 border border-[#242f44]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Billing Contact
          </span>
          <div className="flex items-center gap-2 text-xs text-slate-200">
            <Mail className="w-4 h-4 text-slate-400" />
            <span>{customer.email}</span>
          </div>
          {customer.phone && (
            <div className="flex items-center gap-2 text-xs text-slate-200">
              <Phone className="w-4 h-4 text-slate-400" />
              <span>{customer.phone}</span>
            </div>
          )}
        </Card>

        <Card surface="dark" className="p-4 space-y-2 border border-[#242f44]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Tax Registration
          </span>
          <p className="text-sm font-bold font-mono text-white">
            {customer.taxNumber || 'No GSTIN provided'}
          </p>
          <p className="text-[11px] text-slate-400">Applicable tax rate: 18% GST (Standard)</p>
        </Card>

        <Card surface="dark" className="p-4 space-y-2 border border-[#242f44]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Billing Address
          </span>
          <div className="flex items-start gap-2 text-xs text-slate-200">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p>{customer.addressLine1 || 'Registered address on file'}</p>
              <p>{customer.city ? `${customer.city}, ` : ''}{customer.country}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Subscriptions Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-[#242f44] pb-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            Commercial Subscriptions ({subscriptions.length})
          </h2>
        </div>

        <Table<SubscriptionDTO>
          columns={[
            {
              header: 'Subscription #',
              cell: (s) => (
                <Link
                  href={`/sales/subscriptions/${s.id}`}
                  className="font-bold text-white hover:text-[#fcee21] font-mono text-xs"
                >
                  {s.subscriptionNumber}
                </Link>
              ),
            },
            {
              header: 'Plan',
              cell: (s) => (
                <span className="text-xs font-semibold text-slate-200">{s.planNickname}</span>
              ),
            },
            {
              header: 'Status',
              cell: (s) => <SubscriptionStatusBadge status={s.status} size="sm" />,
            },
            {
              header: 'Interval',
              cell: (s) => (
                <span className="text-xs text-slate-400 font-mono capitalize">
                  {s.billingInterval}
                </span>
              ),
            },
            {
              header: 'Total Value',
              align: 'right',
              cell: (s) => (
                <span className="font-mono font-bold text-xs text-white">
                  {formatMoney(s.totalAmount, s.currency)}
                </span>
              ),
            },
          ]}
          data={subscriptions}
          keyExtractor={(s) => s.id}
          emptyMessage="No subscriptions recorded for this account."
        />
      </div>

      {/* Invoices Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-[#242f44] pb-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            Invoices & Settlement History ({invoices.length})
          </h2>
        </div>

        <Table<InvoiceDTO>
          columns={[
            {
              header: 'Invoice #',
              cell: (i) => (
                <Link
                  href={`/finance/invoices/${i.id}`}
                  className="font-bold text-white hover:text-[#fcee21] font-mono text-xs"
                >
                  {i.invoiceNumber}
                </Link>
              ),
            },
            {
              header: 'Status',
              cell: (i) => (
                <InvoiceStatusBadge status={i.status} isOverdue={i.isOverdue} size="sm" />
              ),
            },
            {
              header: 'Due Date',
              cell: (i) => (
                <span className="text-xs font-mono text-slate-300">
                  {formatDate(i.dueDate)}
                </span>
              ),
            },
            {
              header: 'Settled',
              align: 'right',
              cell: (i) => (
                <span className="font-mono text-xs text-emerald-400">
                  {formatMoney(i.paidAmount, i.currency)}
                </span>
              ),
            },
            {
              header: 'Balance',
              align: 'right',
              cell: (i) => (
                <span className="font-mono font-bold text-xs text-white">
                  {formatMoney(i.outstandingBalance, i.currency)}
                </span>
              ),
            },
          ]}
          data={invoices}
          keyExtractor={(i) => i.id}
          emptyMessage="No invoices issued for this customer yet."
        />
      </div>
    </div>
  );
}
