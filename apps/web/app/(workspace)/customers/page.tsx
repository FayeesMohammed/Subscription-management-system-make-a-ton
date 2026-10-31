'use client';

import React, { useState, useEffect } from 'react';
import { Button, Input, Table, Modal, Card, EmptyState } from '@brightloop/ui';
import { CustomerDTO } from '@/mocks/types';
import { mockRepo } from '@/mocks/repository';
import { useApp } from '@/lib/context';
import { PlusCircle, Search, Users, ExternalLink, MapPin } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/formatters';

export default function CustomersPage() {
  const { refreshKey, triggerRefresh } = useApp();
  const [customers, setCustomers] = useState<CustomerDTO[]>([]);
  const [search, setSearch] = useState('');
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    try {
      setSubmitting(true);
      await mockRepo.createCustomer({
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
              Customer Directory
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-[#151b28] border border-[#242f44] text-slate-300">
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

      {/* Search Bar */}
      <div className="max-w-md">
        <Input
          placeholder="Search by customer name, email, or GSTIN / Tax ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftAddon={<Search className="w-4 h-4 text-slate-400" />}
        />
      </div>

      {/* Table */}
      <Table<CustomerDTO>
        columns={[
          {
            header: 'Customer Account',
            cell: (c) => (
              <div className="space-y-0.5">
                <Link
                  href={`/customers/${c.id}`}
                  className="font-bold text-white hover:text-[#fcee21] flex items-center gap-1.5 group"
                >
                  <span>{c.name}</span>
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-[#fcee21]" />
                </Link>
                <p className="text-xs text-slate-400">{c.email}</p>
              </div>
            ),
          },
          {
            header: 'Tax ID / GSTIN',
            cell: (c) => (
              <span className="font-mono text-xs text-slate-300">
                {c.taxNumber || '—'}
              </span>
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
            header: 'Action',
            align: 'right',
            cell: (c) => (
              <Link href={`/customers/${c.id}`}>
                <Button variant="outline" size="sm">
                  View Profile
                </Button>
              </Link>
            ),
          },
        ]}
        data={customers}
        keyExtractor={(c) => c.id}
        isLoading={loading}
        emptyMessage="No customer accounts match your search criteria."
      />

      {/* Modal: Add Customer */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Customer"
        description="Create a commercial billing profile for subscription contracting."
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
              onChange={(e) => setTaxNumber(e.target.value)}
              placeholder="e.g. 29ABCDE1234F1Z5"
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
