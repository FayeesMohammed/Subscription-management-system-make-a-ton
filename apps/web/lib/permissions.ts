import { TenantRole } from '@brightloop/shared-types';

export type Capability =
  | 'tenant:read'
  | 'tenant:manage'
  | 'staff:read'
  | 'staff:manage'
  | 'catalog:read'
  | 'catalog:write'
  | 'cost_price:view'
  | 'discount:read'
  | 'discount:write'
  | 'customer:read'
  | 'customer:write'
  | 'template:read'
  | 'template:write'
  | 'quotation:read'
  | 'quotation:write'
  | 'quotation:issue'
  | 'quotation:accept'
  | 'subscription:read'
  | 'subscription:write'
  | 'subscription:transition'
  | 'subscription:close'
  | 'invoice:read'
  | 'invoice:confirm'
  | 'invoice:void'
  | 'invoice:download'
  | 'payment:read'
  | 'payment:record'
  | 'reporting:view'
  | 'portal:self_read';

const ROLE_CAPABILITIES: Record<string, Capability[]> = {
  [TenantRole.TENANT_ADMIN]: [
    'tenant:read',
    'tenant:manage',
    'staff:read',
    'staff:manage', // Only Admin can invite/add staff
    'catalog:read',
    'catalog:write',
    'cost_price:view', // Admin can see internal margin & cost prices
    'discount:read',
    'discount:write', // Only Admin can mutate discount rules
    'customer:read',
    'customer:write',
    'template:read',
    'template:write',
    'quotation:read',
    'quotation:write',
    'quotation:issue',
    'quotation:accept',
    'subscription:read',
    'subscription:write',
    'subscription:transition',
    'subscription:close',
    'invoice:read',
    'invoice:confirm',
    'invoice:void',
    'invoice:download',
    'payment:read',
    'payment:record',
    'reporting:view',
  ],

  [TenantRole.ADMIN]: [
    'tenant:read',
    'tenant:manage',
    'staff:read',
    'staff:manage',
    'catalog:read',
    'catalog:write',
    'cost_price:view',
    'discount:read',
    'discount:write',
    'customer:read',
    'customer:write',
    'template:read',
    'template:write',
    'quotation:read',
    'quotation:write',
    'quotation:issue',
    'quotation:accept',
    'subscription:read',
    'subscription:write',
    'subscription:transition',
    'subscription:close',
    'invoice:read',
    'invoice:confirm',
    'invoice:void',
    'invoice:download',
    'payment:read',
    'payment:record',
    'reporting:view',
  ],

  [TenantRole.TENANT_STAFF]: [
    'tenant:read',
    'staff:read', // Can see team member directory, but CANNOT add/invite staff
    'catalog:read',
    'catalog:write', // Can edit products/plans
    // Notice: NO 'cost_price:view'
    'discount:read', // Can inspect discount rules in read-only mode, but CANNOT mutate them
    // Notice: NO 'discount:write'
    'customer:read',
    'customer:write',
    'template:read',
    'template:write',
    'quotation:read',
    'quotation:write',
    'quotation:issue',
    'subscription:read',
    'subscription:write',
    'subscription:transition',
    'subscription:close',
    'invoice:read',
    'invoice:confirm',
    'invoice:download',
    'payment:read',
    'payment:record',
    'reporting:view',
  ],

  [TenantRole.STAFF]: [
    'tenant:read',
    'staff:read',
    'catalog:read',
    'catalog:write',
    'discount:read',
    'customer:read',
    'customer:write',
    'template:read',
    'template:write',
    'quotation:read',
    'quotation:write',
    'quotation:issue',
    'subscription:read',
    'subscription:write',
    'subscription:transition',
    'subscription:close',
    'invoice:read',
    'invoice:confirm',
    'invoice:download',
    'payment:read',
    'payment:record',
    'reporting:view',
  ],

  [TenantRole.CUSTOMER_PORTAL]: [
    'portal:self_read',
    'quotation:accept',
    'invoice:download',
  ],
};

export function hasCapability(role: TenantRole | string, capability: Capability): boolean {
  const capabilities = ROLE_CAPABILITIES[role] || [];
  return capabilities.includes(capability);
}

export function getRoleCapabilities(role: TenantRole | string): Capability[] {
  return ROLE_CAPABILITIES[role] || [];
}
