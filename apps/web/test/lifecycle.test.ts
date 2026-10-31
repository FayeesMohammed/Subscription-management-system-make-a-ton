import assert from 'node:assert/strict';
import { test, describe } from 'node:test';
import { SubscriptionStatus, InvoiceStatus, TenantRole } from '@brightloop/shared-types';
import {
  getPermittedSubscriptionTransitions,
  getPermittedInvoiceTransitions,
  isInvoiceImmutable,
} from '../lib/lifecycle.ts';

describe('Commercial Subscription Lifecycle State Machine', () => {
  test('DRAFT subscriptions can only be transitioned to QUOTATION (plus authorized early close)', () => {
    const actions = getPermittedSubscriptionTransitions(SubscriptionStatus.DRAFT, TenantRole.TENANT_ADMIN);
    const targets = actions.map((a) => a.targetStatus);

    assert.ok(targets.includes(SubscriptionStatus.QUOTATION));
    assert.ok(!targets.includes(SubscriptionStatus.ACTIVE));
    assert.ok(!targets.includes(SubscriptionStatus.CONFIRMED));
  });

  test('QUOTATION status permits acceptance to CONFIRMED', () => {
    const adminActions = getPermittedSubscriptionTransitions(SubscriptionStatus.QUOTATION, TenantRole.TENANT_ADMIN);
    const portalActions = getPermittedSubscriptionTransitions(SubscriptionStatus.QUOTATION, TenantRole.CUSTOMER_PORTAL);

    assert.ok(adminActions.map((a) => a.targetStatus).includes(SubscriptionStatus.CONFIRMED));
    assert.ok(portalActions.map((a) => a.targetStatus).includes(SubscriptionStatus.CONFIRMED));
  });

  test('CONFIRMED status advances to ACTIVE', () => {
    const actions = getPermittedSubscriptionTransitions(SubscriptionStatus.CONFIRMED, TenantRole.TENANT_STAFF);
    assert.ok(actions.map((a) => a.targetStatus).includes(SubscriptionStatus.ACTIVE));
  });

  test('ACTIVE status transitions to CLOSED', () => {
    const actions = getPermittedSubscriptionTransitions(SubscriptionStatus.ACTIVE, TenantRole.TENANT_STAFF);
    assert.ok(actions.map((a) => a.targetStatus).includes(SubscriptionStatus.CLOSED));
  });
});

describe('Invoice Immutability & Lifecycle', () => {
  test('Draft invoice can be confirmed or voided', () => {
    const actions = getPermittedInvoiceTransitions(InvoiceStatus.DRAFT, TenantRole.TENANT_ADMIN);
    const targets = actions.map((a) => a.targetStatus);

    assert.ok(targets.includes(InvoiceStatus.CONFIRMED));
    assert.ok(targets.includes(InvoiceStatus.VOID));
    assert.equal(isInvoiceImmutable(InvoiceStatus.DRAFT), false);
  });

  test('Confirmed invoice is permanently locked and immutable', () => {
    assert.equal(isInvoiceImmutable(InvoiceStatus.CONFIRMED), true);
    assert.equal(isInvoiceImmutable(InvoiceStatus.FINALIZED), true);
    assert.equal(isInvoiceImmutable(InvoiceStatus.PAID), true);
    assert.equal(isInvoiceImmutable(InvoiceStatus.VOID), true);

    const actions = getPermittedInvoiceTransitions(InvoiceStatus.CONFIRMED, TenantRole.TENANT_STAFF);
    const targets = actions.map((a) => a.targetStatus);

    // Cannot confirm an already confirmed invoice
    assert.ok(!targets.includes(InvoiceStatus.CONFIRMED));
  });
});
