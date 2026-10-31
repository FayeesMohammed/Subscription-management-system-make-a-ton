import assert from 'node:assert/strict';
import { test, describe } from 'node:test';
import { TenantRole } from '@brightloop/shared-types';
import { hasCapability, getRoleCapabilities } from '../lib/permissions.ts';

describe('Role-Based Access Control & Capabilities (RBAC)', () => {
  test('TENANT_ADMIN possesses full governance capabilities including staff & discounts', () => {
    assert.equal(hasCapability(TenantRole.TENANT_ADMIN, 'staff:manage'), true);
    assert.equal(hasCapability(TenantRole.TENANT_ADMIN, 'discount:write'), true);
    assert.equal(hasCapability(TenantRole.TENANT_ADMIN, 'cost_price:view'), true);
    assert.equal(hasCapability(TenantRole.TENANT_ADMIN, 'tenant:manage'), true);
    assert.equal(hasCapability(TenantRole.TENANT_ADMIN, 'invoice:confirm'), true);
    assert.equal(hasCapability(TenantRole.TENANT_ADMIN, 'payment:record'), true);
  });

  test('TENANT_STAFF is strictly forbidden from staff invites, discount mutations & cost prices', () => {
    // Negative security assertions
    assert.equal(hasCapability(TenantRole.TENANT_STAFF, 'staff:manage'), false);
    assert.equal(hasCapability(TenantRole.TENANT_STAFF, 'discount:write'), false);
    assert.equal(hasCapability(TenantRole.TENANT_STAFF, 'cost_price:view'), false);
    assert.equal(hasCapability(TenantRole.TENANT_STAFF, 'tenant:manage'), false);

    // Permitted operational capabilities
    assert.equal(hasCapability(TenantRole.TENANT_STAFF, 'staff:read'), true);
    assert.equal(hasCapability(TenantRole.TENANT_STAFF, 'customer:write'), true);
    assert.equal(hasCapability(TenantRole.TENANT_STAFF, 'quotation:write'), true);
    assert.equal(hasCapability(TenantRole.TENANT_STAFF, 'subscription:transition'), true);
    assert.equal(hasCapability(TenantRole.TENANT_STAFF, 'invoice:confirm'), true);
    assert.equal(hasCapability(TenantRole.TENANT_STAFF, 'payment:record'), true);
  });

  test('CUSTOMER_PORTAL is strictly limited to self-read, quote acceptance and downloads', () => {
    // Portal capabilities
    assert.equal(hasCapability(TenantRole.CUSTOMER_PORTAL, 'portal:self_read'), true);
    assert.equal(hasCapability(TenantRole.CUSTOMER_PORTAL, 'quotation:accept'), true);
    assert.equal(hasCapability(TenantRole.CUSTOMER_PORTAL, 'invoice:download'), true);

    // Forbidden capabilities
    assert.equal(hasCapability(TenantRole.CUSTOMER_PORTAL, 'staff:read'), false);
    assert.equal(hasCapability(TenantRole.CUSTOMER_PORTAL, 'catalog:write'), false);
    assert.equal(hasCapability(TenantRole.CUSTOMER_PORTAL, 'discount:read'), false);
    assert.equal(hasCapability(TenantRole.CUSTOMER_PORTAL, 'payment:record'), false);
    assert.equal(hasCapability(TenantRole.CUSTOMER_PORTAL, 'reporting:view'), false);
    assert.equal(hasCapability(TenantRole.CUSTOMER_PORTAL, 'cost_price:view'), false);
  });
});
