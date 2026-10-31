'use client';

import React, { useState, useEffect } from 'react';
import { Card, Input, Button } from '@brightloop/ui';
import { CustomerDTO } from '@/mocks/types';
import { mockRepo } from '@/mocks/repository';
import { Building, Mail, Phone, MapPin, ShieldCheck, User } from 'lucide-react';

export default function PortalProfilePage() {
  const [customer, setCustomer] = useState<CustomerDTO | null>(null);
  const [loading, setLoading] = useState(true);

  const customerId = 'cust-101';

  useEffect(() => {
    async function load() {
      setLoading(true);
      const c = await mockRepo.getCustomerById(customerId);
      if (c) setCustomer(c);
      setLoading(false);
    }
    load();
  }, []);

  if (loading || !customer) {
    return <div className="p-8 text-center text-slate-400">Loading your profile...</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#242f44] pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Customer Account Profile
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Registered commercial entity information, billing address, and tax registration.
          </p>
        </div>
      </div>

      <Card surface="dark" className="space-y-4 border border-[#242f44]">
        <div className="flex items-center gap-2 border-b border-[#242f44] pb-3">
          <Building className="w-4 h-4 text-[#fcee21]" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            Commercial Details
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Company Name" value={customer.name} disabled />
          <Input label="Tax ID / GSTIN" value={customer.taxNumber || '—'} disabled />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Billing Contact Email" value={customer.email} disabled />
          <Input label="Phone Number" value={customer.phone || '—'} disabled />
        </div>

        <Input
          label="Registered Billing Address"
          value={`${customer.addressLine1 || ''}, ${customer.city || ''}, ${customer.country}`}
          disabled
        />
      </Card>
    </div>
  );
}
