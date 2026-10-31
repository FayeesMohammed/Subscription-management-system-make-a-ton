'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { TenantRole } from '@brightloop/shared-types';
import { MockScenario, mockRepo } from '@/mocks/repository';
import { hasCapability, Capability } from './permissions';

interface UserSession {
  id: string;
  name: string;
  email: string;
  role: TenantRole;
  tenantId: string;
  tenantName: string;
}

interface AppContextType {
  user: UserSession;
  role: TenantRole;
  scenario: MockScenario;
  switchRole: (newRole: TenantRole) => void;
  switchScenario: (newScenario: MockScenario) => void;
  can: (capability: Capability) => boolean;
  refreshKey: number;
  triggerRefresh: () => void;
}

const DEFAULT_USERS: Record<TenantRole, UserSession> = {
  [TenantRole.TENANT_ADMIN]: {
    id: 'user-admin-1',
    name: 'Vikram Mehta',
    email: 'vikram.mehta@acmesaas.in',
    role: TenantRole.TENANT_ADMIN,
    tenantId: 'tenant-001',
    tenantName: 'Acme SaaS India',
  },
  [TenantRole.TENANT_STAFF]: {
    id: 'user-staff-1',
    name: 'Priya Sharma',
    email: 'priya.sharma@acmesaas.in',
    role: TenantRole.TENANT_STAFF,
    tenantId: 'tenant-001',
    tenantName: 'Acme SaaS India',
  },
  [TenantRole.CUSTOMER_PORTAL]: {
    id: 'user-customer-1',
    name: 'Rajesh Iyer',
    email: 'billing@enterprise-corp.in',
    role: TenantRole.CUSTOMER_PORTAL,
    tenantId: 'tenant-001',
    tenantName: 'Enterprise Client Corp',
  },
  // Fallbacks for other enum values
  [TenantRole.ADMIN]: {
    id: 'user-admin-1',
    name: 'Vikram Mehta',
    email: 'vikram.mehta@acmesaas.in',
    role: TenantRole.TENANT_ADMIN,
    tenantId: 'tenant-001',
    tenantName: 'Acme SaaS India',
  },
  [TenantRole.STAFF]: {
    id: 'user-staff-1',
    name: 'Priya Sharma',
    email: 'priya.sharma@acmesaas.in',
    role: TenantRole.TENANT_STAFF,
    tenantId: 'tenant-001',
    tenantName: 'Acme SaaS India',
  },
  [TenantRole.OWNER]: {
    id: 'user-admin-1',
    name: 'Vikram Mehta',
    email: 'vikram.mehta@acmesaas.in',
    role: TenantRole.TENANT_ADMIN,
    tenantId: 'tenant-001',
    tenantName: 'Acme SaaS India',
  },
  [TenantRole.FINANCE]: {
    id: 'user-staff-1',
    name: 'Priya Sharma',
    email: 'priya.sharma@acmesaas.in',
    role: TenantRole.TENANT_STAFF,
    tenantId: 'tenant-001',
    tenantName: 'Acme SaaS India',
  },
  [TenantRole.MEMBER]: {
    id: 'user-staff-1',
    name: 'Priya Sharma',
    email: 'priya.sharma@acmesaas.in',
    role: TenantRole.TENANT_STAFF,
    tenantId: 'tenant-001',
    tenantName: 'Acme SaaS India',
  },
  [TenantRole.VIEWER]: {
    id: 'user-staff-1',
    name: 'Priya Sharma',
    email: 'priya.sharma@acmesaas.in',
    role: TenantRole.TENANT_STAFF,
    tenantId: 'tenant-001',
    tenantName: 'Acme SaaS India',
  },
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<TenantRole>(TenantRole.TENANT_ADMIN);
  const [scenario, setScenario] = useState<MockScenario>('CONFIGURED_TENANT');
  const [refreshKey, setRefreshKey] = useState(0);

  const switchRole = (newRole: TenantRole) => {
    setRole(newRole);
    setRefreshKey((k) => k + 1);
  };

  const switchScenario = (newScenario: MockScenario) => {
    setScenario(newScenario);
    mockRepo.resetToScenario(newScenario);
    setRefreshKey((k) => k + 1);
  };

  const triggerRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  const can = (capability: Capability): boolean => {
    return hasCapability(role, capability);
  };

  const user = DEFAULT_USERS[role] || DEFAULT_USERS[TenantRole.TENANT_ADMIN];

  return (
    <AppContext.Provider
      value={{
        user,
        role,
        scenario,
        switchRole,
        switchScenario,
        can,
        refreshKey,
        triggerRefresh,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
