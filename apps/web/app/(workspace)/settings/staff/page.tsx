'use client';

import React, { useState, useEffect } from 'react';
import { Button, Input, Table, Modal, Card, Select } from '@brightloop/ui';
import { StaffMemberDTO } from '@/mocks/types';
import { mockRepo } from '@/mocks/repository';
import { useApp } from '@/lib/context';
import { formatDate } from '@/lib/formatters';
import { TenantRole } from '@brightloop/shared-types';
import { UserPlus, Shield, ShieldCheck, Mail, Clock } from 'lucide-react';
import { AccessDeniedNotice } from '@/components/domain/AccessDeniedNotice';

export default function StaffPage() {
  const { refreshKey, triggerRefresh, can, role } = useApp();
  const [staff, setStaff] = useState<StaffMemberDTO[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite Staff Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [targetRole, setTargetRole] = useState<TenantRole>(TenantRole.TENANT_STAFF);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await mockRepo.getStaff();
      setStaff(data);
      setLoading(false);
    }
    load();
  }, [refreshKey]);

  // Enforce Admin RBAC: Only TENANT_ADMIN can manage or add staff
  const canManageStaff = can('staff:manage');

  if (!canManageStaff) {
    return (
      <AccessDeniedNotice
        title="Access Denied: Staff Governance"
        message="Only users with the TENANT_ADMIN role are authorized to view team rosters or issue staff membership invitations."
        requiredCapability="staff:manage"
      />
    );
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    try {
      setSubmitting(true);
      await mockRepo.inviteStaff({
        name,
        email,
        role: targetRole,
      });
      setIsModalOpen(false);
      setName('');
      setEmail('');
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
              Staff &amp; Role Governance
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-[#151b28] border border-[#242f44] text-[#fcee21]">
              TENANT_ADMIN Access
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Invite and assign operational roles: TENANT_ADMIN or TENANT_STAFF.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<UserPlus className="w-4 h-4" />}
          onClick={() => setIsModalOpen(true)}
        >
          Add Staff Member
        </Button>
      </div>

      {/* Staff Table */}
      <Table<StaffMemberDTO>
        columns={[
          {
            header: 'Staff Member',
            cell: (s) => (
              <div className="space-y-0.5">
                <p className="font-bold text-white text-xs">{s.name}</p>
                <p className="text-[11px] text-slate-400">{s.email}</p>
              </div>
            ),
          },
          {
            header: 'Assigned Role',
            cell: (s) => (
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                  s.role === TenantRole.TENANT_ADMIN
                    ? 'bg-[#fcee21]/15 text-[#fcee21] border-[#fcee21]/40'
                    : 'bg-sky-950/60 text-sky-300 border-sky-800'
                }`}
              >
                {s.role}
              </span>
            ),
          },
          {
            header: 'Membership State',
            cell: (s) => (
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  s.status === 'active'
                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                    : 'bg-amber-950/60 text-amber-300 border border-amber-800 animate-pulse'
                }`}
              >
                {s.status === 'active' ? 'Active' : 'Invitation Pending'}
              </span>
            ),
          },
          {
            header: 'Invited Date',
            cell: (s) => (
              <span className="text-xs text-slate-400 font-mono">
                {formatDate(s.invitedAt)}
              </span>
            ),
          },
        ]}
        data={staff}
        keyExtractor={(s) => s.id}
        isLoading={loading}
      />

      {/* Modal: Add Staff */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Invite Staff Member"
        description="Grant operational access to the workspace. Permissions are strictly derived from role."
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
              onClick={handleInvite}
              isLoading={submitting}
            >
              Send Invitation
            </Button>
          </>
        }
      >
        <form onSubmit={handleInvite} className="space-y-4">
          <Input
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ananya Sen"
            required
          />
          <Input
            label="Official Work Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ananya.sen@acmesaas.in"
            required
          />
          <Select
            label="Designated RBAC Role"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value as TenantRole)}
            options={[
              {
                value: TenantRole.TENANT_STAFF,
                label: 'TENANT_STAFF — Day-to-day operations (No staff/discount mutations)',
              },
              {
                value: TenantRole.TENANT_ADMIN,
                label: 'TENANT_ADMIN — Full administrative control & governance',
              },
            ]}
          />
        </form>
      </Modal>
    </div>
  );
}
