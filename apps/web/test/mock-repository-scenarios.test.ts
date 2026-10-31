import assert from 'node:assert/strict';
import { test, describe } from 'node:test';
import { mockRepo } from '../mocks/repository.ts';
import { SubscriptionStatus, InvoiceStatus } from '@brightloop/shared-types';

describe('Deterministic Mock Repository & Scenarios', () => {
  test('EMPTY_TENANT scenario yields zero records for first-run empty state testing', async () => {
    mockRepo.resetToScenario('EMPTY_TENANT');

    const customers = await mockRepo.getCustomers();
    const subs = await mockRepo.getSubscriptions();
    const invoices = await mockRepo.getInvoices();
    const plans = await mockRepo.getPlans();
    const discounts = await mockRepo.getDiscounts();
    const metrics = await mockRepo.getDashboardMetrics();

    assert.equal(customers.length, 0);
    assert.equal(subs.length, 0);
    assert.equal(invoices.length, 0);
    assert.equal(plans.length, 0);
    assert.equal(discounts.length, 0);
    assert.equal(metrics.activeSubscriptions, 0);
    assert.equal(metrics.collectedRevenue, '0.00');
  });

  test('QUOTE_NEAR_EXPIRY sets quotation expiry to within 2 hours', async () => {
    mockRepo.resetToScenario('QUOTE_NEAR_EXPIRY');
    const quote = await mockRepo.getSubscriptionById('sub-202');

    assert.ok(quote);
    assert.equal(quote.status, SubscriptionStatus.QUOTATION);
    assert.ok(quote.validUntil);

    const diffMs = new Date(quote.validUntil).getTime() - Date.now();
    const diffHours = diffMs / (3600 * 1000);
    assert.ok(diffHours > 0 && diffHours <= 2.1);
  });

  test('OVERDUE_INVOICE scenario exposes overdue flag and overdue receivables metric', async () => {
    mockRepo.resetToScenario('OVERDUE_INVOICE');
    const overdueInv = await mockRepo.getInvoiceById('inv-303-overdue');

    assert.ok(overdueInv);
    assert.equal(overdueInv.isOverdue, true);

    const metrics = await mockRepo.getDashboardMetrics();
    assert.equal(metrics.overdueReceivables, '5900.00');
  });

  test('PORTAL_EMPTY scenario provides a customer account with zero records', async () => {
    mockRepo.resetToScenario('PORTAL_EMPTY');
    const subs = await mockRepo.getSubscriptions('cust-101');
    const invs = await mockRepo.getInvoices('cust-101');

    assert.equal(subs.length, 0);
    assert.equal(invs.length, 0);
  });
});
