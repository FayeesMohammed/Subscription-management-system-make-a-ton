'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button, Input, Table, Modal, Card, EmptyState } from '@brightloop/ui';
import { CustomerDTO } from '@/mocks/types';
import { mockRepo } from '@/mocks/repository';
import { useApp } from '@/lib/context';
import { useToast } from '@/lib/toast';
import {
  PlusCircle,
  Search,
  Users,
  ExternalLink,
  MapPin,
  Copy,
  Check,
  FileSignature,
  Building2,
  Globe,
  Receipt,
} from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/formatters';

export default function CustomersPage() {
  const { refreshKey, triggerRefresh } = useApp();
  const { success, error } = useToast();
  const [customers, setCustomers] = useState<CustomerDTO[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'GST' | 'INR' | 'USD'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('IN');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await mockRepo.getCustomers(search);
      setCustomers(data);
      setLoading(false);
    }
    load();
  }, [search, refreshKey]);

  const handleCopyTax = (e: React.MouseEvent, tax: string, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(tax);
    setCopiedId(id);
    success('Tax ID Copied', `Copied ${tax} to clipboard.`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    try {
      setSubmitting(true);
      const newCust = await mockRepo.createCustomer({
        name,
        email,
        phone: phone || undefined,
        taxNumber: taxNumber || undefined,
        city: city || undefined,
        country,
        currency: country === 'IN' ? 'INR' : 'USD',
      });
      setIsModalOpen(false);
      setName('');
      setEmail('');
      setPhone('');
      setTaxNumber('');
      setCity('');
      success('Customer Registered', `${newCust.name} successfully registered.`);
      triggerRefresh();
    } catch (err: unknown) {
      error('Failed to register customer', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (filterType === 'GST') return Boolean(c.taxNumber);
      if (filterType === 'INR') return c.currency === 'INR';
      if (filterType === 'USD') return c.currency === 'USD';
      return true;
    });
  }, [customers, filterType]);

  const stats = useMemo(() => {
    const total = customers.length;
    const gstRegistered = customers.filter((c) => Boolean(c.taxNumber)).length;
    const inrAccounts = customers.filter((c) => c.currency === 'INR').length;
    const usdAccounts = customers.filter((c) => c.currency === 'USD').length;
    return { total, gstRegistered, inrAccounts, usdAccounts };
  }, [customers]);

  const getInitials = (custName: string) => {
    const parts = custName.split(' ').filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return custName.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#242f44] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              Customer Directory
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#151b28] border border-[#242f44] text-[#fcee21]">
              {customers.length} Accounts
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Commercial billing accounts, registered entities, and tax identifiers.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<PlusCircle className="w-4 h-4" />}
          onClick={() => setIsModalOpen(true)}
        >
          Add Customer
        </Button>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-[#0d111a] border border-[#242f44] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Accounts</span>
            <p className="text-lg font-extrabold font-mono text-white mt-0.5">{stats.total}</p>
          </div>
          <Users className="w-5 h-5 text-slate-500" />
        </div>
        <div className="p-3 rounded-xl bg-[#0d111a] border border-[#242f44] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">GST Registered</span>
            <p className="text-lg font-extrabold font-mono text-emerald-400 mt-0.5">{stats.gstRegistered}</p>
          </div>
          <Receipt className="w-5 h-5 text-emerald-500" />
        </div>
        <div className="p-3 rounded-xl bg-[#0d111a] border border-[#242f44] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Domestic (INR)</span>
            <p className="text-lg font-extrabold font-mono text-[#fcee21] mt-0.5">{stats.inrAccounts}</p>
          </div>
          <Building2 className="w-5 h-5 text-[#fcee21]" />
        </div>
        <div className="p-3 rounded-xl bg-[#0d111a] border border-[#242f44] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Global (USD)</span>
            <p className="text-lg font-extrabold font-mono text-cyan-400 mt-0.5">{stats.usdAccounts}</p>
          </div>
          <Globe className="w-5 h-5 text-cyan-500" />
        </div>
      </div>

      {/* Search and Filter Chips */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="w-full sm:w-96">
          <Input
            placeholder="Search by customer name, email, or GSTIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftAddon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(
            [
              { id: 'ALL', label: `All (${customers.length})` },
              { id: 'GST', label: `With GSTIN (${stats.gstRegistered})` },
              { id: 'INR', label: `INR (${stats.inrAccounts})` },
              { id: 'USD', label: `USD (${stats.usdAccounts})` },
            ] as const
          ).map((filter) => (
            <button
              key={filter.id}
              onClick={() => setFilterType(filter.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filterType === filter.id
                  ? 'bg-[#fcee21] text-black font-bold shadow-sm'
                  : 'bg-[#151b28] text-slate-400 hover:text-white border border-[#242f44]'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Customers Table */}
      <Table<CustomerDTO>
        columns={[
          {
            header: 'Customer Account',
            cell: (c) => (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#1a2333] to-[#0f1520] border border-[#242f44] flex items-center justify-center text-xs font-extrabold font-mono text-[#fcee21] shrink-0">
                  {getInitials(c.name)}
                </div>
                <div className="space-y-0.5 min-w-0">
                  <Link
                    href={`/customers/${c.id}`}
                    className="font-bold text-white hover:text-[#fcee21] flex items-center gap-1.5 group truncate"
                  >
                    <span className="truncate">{c.name}</span>
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-[#fcee21] shrink-0" />
                  </Link>
                  <p className="text-xs text-slate-400 truncate">{c.email}</p>
                </div>
              </div>
            ),
          },
          {
            header: 'Tax ID / GSTIN',
            cell: (c) =>
              c.taxNumber ? (
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs text-slate-200 bg-[#151b28] px-2 py-0.5 rounded border border-[#242f44]">
                    {c.taxNumber}
                  </span>
                  <button
                    onClick={(e) => handleCopyTax(e, c.taxNumber!, c.id)}
                    className="p-1 text-slate-400 hover:text-[#fcee21] transition-colors rounded hover:bg-[#1f293d]"
                    title="Copy Tax ID"
                  >
                    {copiedId === c.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ) : (
                <span className="text-xs text-slate-500 font-mono">Unregistered</span>
              ),
          },
          {
            header: 'Location',
            cell: (c) => (
              <div className="flex items-center gap-1 text-xs text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{c.city ? `${c.city}, ${c.country}` : c.country}</span>
              </div>
            ),
          },
          {
            header: 'Currency',
            cell: (c) => (
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#151b28] border border-[#242f44] text-[#fcee21]">
                {c.currency}
              </span>
            ),
          },
          {
            header: 'Created On',
            cell: (c) => (
              <span className="text-xs text-slate-400 font-mono">
                {formatDate(c.createdAt)}
              </span>
            ),
          },
          {
            header: 'Actions',
            align: 'right',
            cell: (c) => (
              <div className="flex items-center justify-end gap-2">
                <Link href={`/sales/quotes?customer=${c.id}`}>
                  <Button variant="outline" size="sm" leftIcon={<FileSignature className="w-3.5 h-3.5" />}>
                    Quote
                  </Button>
                </Link>
                <Link href={`/customers/${c.id}`}>
                  <Button variant="secondary" size="sm">
                    Profile
                  </Button>
                </Link>
              </div>
            ),
          },
        ]}
        data={filteredCustomers}
        keyExtractor={(c) => c.id}
        isLoading={loading}
        emptyMessage="No customer accounts match your search or filter criteria."
      />

      {/* Modal: Add Customer */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Customer Account"
        description="Create a commercial billing profile for subscription contracting and automated invoicing."
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
              onClick={handleCreate}
              isLoading={submitting}
            >
              Save Customer
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Company or Customer Legal Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Acme Technologies Private Limited"
            required
          />
          <Input
            label="Primary Billing Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="billing@acmetech.in"
            required
            hint="Receives automated recurring invoice PDFs and payment receipts"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Contact Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
            />
            <Input
              label="GSTIN / Tax Identification"
              value={taxNumber}
              onChange={(e) => setTaxNumber(e.target.value.toUpperCase())}
              placeholder="e.g. 29ABCDE1234F1Z5"
              hint="Required for B2B input tax credit"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Bengaluru"
            />
            <Input
              label="Country Code (ISO-2)"
              value={country}
              onChange={(e) => setCountry(e.target.value.toUpperCase())}
              placeholder="IN"
              maxLength={2}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
