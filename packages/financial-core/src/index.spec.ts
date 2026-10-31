import assert from 'node:assert/strict';
import { test, describe } from 'node:test';
import {
  toMinorUnits,
  fromMinorUnits,
  calculateLineItem,
  calculateProration,
  calculateItemMRR,
  Decimal,
} from './index.js';

describe('Financial Core Engine', () => {
  test('converts minor units correctly without floating point errors', () => {
    assert.equal(toMinorUnits('199.99', 'INR'), 19999n);
    assert.equal(toMinorUnits(new Decimal('0.10'), 'USD'), 10n);
    assert.equal(toMinorUnits(500, 'JPY'), 500n);

    assert.equal(fromMinorUnits(19999n, 'INR').toString(), '199.99');
    assert.equal(fromMinorUnits(10n, 'USD').toString(), '0.1');
    assert.equal(fromMinorUnits(500n, 'JPY').toString(), '500');
  });

  test('calculates line items with exact discount and tax', () => {
    // 2 units at 100.00 = 200.00
    // 10% discount = 20.00 -> net = 180.00
    // 18% GST on 180.00 = 32.40 -> total = 212.40
    const result = calculateLineItem({
      unitPrice: '100.00',
      quantity: 2,
      discountPercentage: 10,
      taxRatePercentage: 18,
    });

    assert.equal(result.grossAmount.toString(), '200');
    assert.equal(result.discountAmount.toString(), '20');
    assert.equal(result.netAmount.toString(), '180');
    assert.equal(result.taxAmount.toString(), '32.4');
    assert.equal(result.totalAmount.toString(), '212.4');
  });

  test('calculates second-precise proration cleanly', () => {
    const start = new Date('2026-01-01T00:00:00Z');
    const end = new Date('2026-01-31T00:00:00Z'); // 30 days = 2,592,000 seconds
    const mid = new Date('2026-01-16T00:00:00Z'); // exactly half way (15 days remaining)

    const result = calculateProration({
      fullPeriodAmount: '1000.00',
      periodStart: start,
      periodEnd: end,
      effectiveDate: mid,
    });

    assert.equal(result.proratedAmount.toString(), '500');
    assert.equal(result.fractionUsed.toString(), '0.5');
  });

  test('calculates MRR normalizing annual, weekly and monthly amounts', () => {
    const monthly = calculateItemMRR({
      interval: 'month',
      unitPrice: '100.00',
      quantity: 1,
    });
    assert.equal(monthly.toString(), '100');

    const annual = calculateItemMRR({
      interval: 'year',
      unitPrice: '1200.00',
      quantity: 1,
    });
    assert.equal(annual.toString(), '100');
  });
});
