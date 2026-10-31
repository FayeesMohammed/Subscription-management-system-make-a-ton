'use client';

import React, { useState } from 'react';
import { Button, Input, Card, Alert } from '@brightloop/ui';
import { useApp } from '@/lib/context';
import { Building, Shield, Save, CheckCircle } from 'lucide-react';

export default function TenantSettingsPage() {
  const { user, can } = useApp();
  const [tenantName, setTenantName] = useState(user.tenantName);
  const [currency, setCurrency] = useState('INR');
  const [gstin, setGstin] = useState('29AABCB1234F1Z1');
  const [address, setAddress] = useState('Level 4, Orion Mall Gateway, Bengaluru, KA 560055');
  const [saved, setSaved] = useState(false);

  const canManage = can('tenant:manage');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#242f44] pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Tenant Configuration &amp; Governance
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Tenant organization profile, legal tax identification, and default invoice parameters.
          </p>
        </div>
      </div>

      {saved && (
        <Alert variant="success" title="Tenant Settings Updated">
          Organization profile and fiscal parameters saved successfully.
        </Alert>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <Card surface="dark" className="space-y-4 border border-[#242f44]">
          <div className="flex items-center gap-2 border-b border-[#242f44] pb-3">
            <Building className="w-4 h-4 text-[#fcee21]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Organization Profile
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Tenant Commercial Entity Name"
              value={tenantName}
              onChange={(e) => setTenantName(e.target.value)}
              disabled={!canManage}
              required
            />
            <Input
              label="Tenant Identifier"
              value={user.tenantId}
              disabled
              hint="Immutable platform tenant ID"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Operating Base Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase())}
              disabled={!canManage}
              required
            />
            <Input
              label="Tax Identification / GSTIN"
              value={gstin}
              onChange={(e) => setGstin(e.target.value)}
              disabled={!canManage}
              required
            />
          </div>

          <Input
            label="Corporate Registered Billing Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={!canManage}
            required
          />
        </Card>

        {canManage ? (
          <div className="flex justify-end">
            <Button
              variant="primary"
              size="md"
              leftIcon={<Save className="w-4 h-4" />}
              type="submit"
            >
              Save Organization Settings
            </Button>
          </div>
        ) : (
          <div className="text-xs text-slate-400 p-3 rounded-lg bg-[#0d111a] border border-[#242f44]">
            Tenant settings modifications are restricted to TENANT_ADMIN.
          </div>
        )}
      </form>
    </div>
  );
}
