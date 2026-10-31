import assert from 'node:assert/strict';
import { test, describe } from 'node:test';
import { mockRepo } from '../mocks/repository.ts';
import { SubscriptionStatus } from '@brightloop/shared-types';

describe('Catalog-To-Quotation Workflow', () => {
  test('creates quotation with variant adjustment, percentage discount, and 18% GST', async () => {
    mockRepo.resetToScenario('CONFIGURED_TENANT');

    // Base plan-001 (10,000 INR) + dedicated VPC variant (5,000 INR) = 15,000 INR
    // Apply discount code LAUNCH2026 (20% off 15,000 = 3,000 INR) -> Net = 12,000 INR
    // 18% GST on 12,000 = 2,160 INR -> Total = 14,160 INR
    const quote = await mockRepo.createSubscriptionDraft(
      {
        customerId: 'cust-101',
        priceId: 'plan-001',
        variantId: 'var-001-ded',
        quantity: 1,
        discountCode: 'LAUNCH2026',
        asQuotation: true,
      },
      'Vikram Mehta (Admin)',
    );

    assert.equal(quote.status, SubscriptionStatus.QUOTATION);
    assert.equal(quote.unitAmount, '15000.00');
    assert.equal(quote.subtotal, '15000.00');
    assert.equal(quote.discountAmount, '3000.00');
    assert.equal(quote.taxAmount, '2160.00');
    assert.equal(quote.totalAmount, '14160.00');
    assert.ok(quote.validUntil); // Must have validity date
  });

  test('transitioning quotation to CONFIRMED and then ACTIVE automatically generates draft invoice', async () => {
    mockRepo.resetToScenario('CONFIGURED_TENANT');

    const quote = await mockRepo.createSubscriptionDraft(
      {
        customerId: 'cust-102',
        priceId: 'plan-001',
        quantity: 1,
        asQuotation: true,
      },
      'Priya Sharma (Staff)',
    );

    // Transition 1: QUOTATION -> CONFIRMED
    const confirmed = await mockRepo.transitionSubscription(
      quote.id,
      SubscriptionStatus.CONFIRMED,
      'Apex Retail (Acceptance)',
    );
    assert.equal(confirmed.status, SubscriptionStatus.CONFIRMED);

    // Transition 2: CONFIRMED -> ACTIVE (starts billing run, creates invoice)
    const active = await mockRepo.transitionSubscription(
      quote.id,
      SubscriptionStatus.ACTIVE,
      'System-managed Activation',
    );
    assert.equal(active.status, SubscriptionStatus.ACTIVE);

    // Check that invoice was created
    const customerInvoices = await mockRepo.getInvoices('cust-102');
    const newInvoice = customerInvoices.find((i) => i.subscriptionId === quote.id);
    assert.ok(newInvoice, 'Draft invoice must be generated upon activation');
    assert.equal(newInvoice.status, 'draft');
  });
});
