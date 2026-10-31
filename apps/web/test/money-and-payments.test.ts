import assert from 'node:assert/strict';
import { test, describe } from 'node:test';
import { formatMoney } from '../lib/formatters.ts';
import { mockRepo } from '../mocks/repository.ts';
import { PaymentMethod, InvoiceStatus } from '@brightloop/shared-types';

describe('Financial Arithmetic & Manual Payment Ledger', () => {
  test('formats money with exact decimal strings and ISO symbols without float errors', () => {
    assert.equal(formatMoney('10000.00', 'INR'), '₹10,000.00');
    assert.equal(formatMoney('9440.00', 'INR'), '₹9,440.00');
    assert.equal(formatMoney('150.50', 'USD'), '$150.50');
    assert.equal(formatMoney('0.00', 'INR'), '₹0.00');
  });

  test('records partial payments, decrements outstanding balance and updates ledger', async () => {
    mockRepo.resetToScenario('CONFIGURED_TENANT');
    const invoiceId = 'inv-302-partial'; // Initial total: 9440.00, paid: 4000.00, outstanding: 5440.00

    const initial = await mockRepo.getInvoiceById(invoiceId);
    assert.ok(initial);
    assert.equal(initial.outstandingBalance, '5440.00');

    // Make partial payment of 2000.00
    const { invoice, payment } = await mockRepo.recordManualPayment(invoiceId, {
      amount: '2000.00',
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      referenceNote: 'NEFT Ref #TESTPARTIAL1',
      recorderName: 'Priya Sharma (Staff)',
    });

    assert.equal(invoice.paidAmount, '6000.00');
    assert.equal(invoice.outstandingBalance, '3440.00');
    assert.equal(invoice.status, InvoiceStatus.CONFIRMED); // Not yet paid
    assert.equal(payment.amount, '2000.00');

    // Settle the remainder (3440.00)
    const finalResult = await mockRepo.recordManualPayment(invoiceId, {
      amount: '3440.00',
      paymentMethod: PaymentMethod.CHEQUE,
      referenceNote: 'Cheque #9991 Final Settlement',
      recorderName: 'Priya Sharma (Staff)',
    });

    assert.equal(finalResult.invoice.paidAmount, '9440.00');
    assert.equal(finalResult.invoice.outstandingBalance, '0.00');
    assert.equal(finalResult.invoice.status, InvoiceStatus.PAID); // Automatically marked PAID!
  });

  test('rejects manual payment exceeding the remaining outstanding balance', async () => {
    mockRepo.resetToScenario('CONFIGURED_TENANT');
    const invoiceId = 'inv-302-partial';

    await assert.rejects(
      async () => {
        await mockRepo.recordManualPayment(invoiceId, {
          amount: '999999.00', // Exceeds balance of 5440.00
          paymentMethod: PaymentMethod.CASH,
          recorderName: 'Priya Sharma (Staff)',
        });
      },
      /exceeds outstanding balance/,
    );
  });
});
