'use client';

import React from 'react';
import { useApp } from '@/lib/context';
import { TenantRole } from '@brightloop/shared-types';
import { Shield, UserCheck, Globe, ChevronDown } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

export const RoleSwitcher: React.FC = () => {
  const { role, switchRole } = useApp();
  const router = useRouter();
  const pathname = usePathname();

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as TenantRole;
    switchRole(newRole);

    if (newRole === TenantRole.CUSTOMER_PORTAL) {
      if (!pathname.startsWith('/portal')) {
        router.push('/portal/home');
      }
    } else {
      if (pathname.startsWith('/portal')) {
        router.push('/dashboard');
      }
    }
  };

  const getRoleIcon = () => {
    switch (role) {
      case TenantRole.TENANT_ADMIN:
        return <Shield className="w-3.5 h-3.5 text-[#fcee21]" />;
      case TenantRole.TENANT_STAFF:
        return <UserCheck className="w-3.5 h-3.5 text-sky-400" />;
      case TenantRole.CUSTOMER_PORTAL:
        return <Globe className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Shield className="w-3.5 h-3.5 text-[#fcee21]" />;
    }
  };

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#151b28] border border-[#242f44] text-xs">
      {getRoleIcon()}
      <span className="font-semibold text-slate-300 hidden sm:inline">Role:</span>
      <select
        value={role}
        onChange={handleRoleChange}
        className="bg-transparent font-bold text-white border-none focus:outline-none cursor-pointer text-xs pr-1"
        aria-label="Active testing role selector"
      >
        <option value={TenantRole.TENANT_ADMIN} className="bg-[#0f131d] text-white">
          TENANT_ADMIN (Full Access)
        </option>
        <option value={TenantRole.TENANT_STAFF} className="bg-[#0f131d] text-white">
          TENANT_STAFF (No Staff/Discounts)
        </option>
        <option value={TenantRole.CUSTOMER_PORTAL} className="bg-[#0f131d] text-white">
          CUSTOMER_PORTAL (Self-Service)
        </option>
      </select>
    </div>
  );
};
