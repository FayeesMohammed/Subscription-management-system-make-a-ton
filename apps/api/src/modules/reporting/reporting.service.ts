import { Injectable } from '@nestjs/common';
import { TenantContextService } from '../../database/tenant-context.service';
import { calculateItemMRR, Decimal } from '@brightloop/financial-core';
import { SubscriptionStatus, InvoiceStatus, PaymentStatus } from '@brightloop/shared-types';

@Injectable()
export class ReportingService {
  constructor(private readonly tenantContext: TenantContextService) {}

  async getMetrics(tenantId: string) {
    return this.tenantContext.withTenant(tenantId, async (tx) => {
      // 1. Fetch active subscriptions with their items and prices
      const subscriptions = await tx.subscription.findMany({
        where: {
          status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
        },
        include: {
          items: {
            include: { price: true },
          },
        },
      });

      // 2. Strict MRR Calculation: Normalize by interval and quantity, exclude tax
      let totalMRR = new Decimal(0);
      let activeCount = 0;
      let trialingCount = 0;

      for (const sub of subscriptions) {
        if (sub.status === SubscriptionStatus.ACTIVE) {
          activeCount++;
          for (const item of sub.items) {
            const itemMRR = calculateItemMRR({
              interval: item.price.billingInterval as any,
              intervalCount: item.price.billingIntervalCount,
              unitPrice: item.price.unitAmount.toString(),
              quantity: item.quantity,
            });
            totalMRR = totalMRR.plus(itemMRR);
          }
        } else if (sub.status === SubscriptionStatus.TRIALING) {
          trialingCount++;
        }
      }

      // 3. Invoice Revenue & Receivables Aggregations
      const invoices = await tx.invoice.findMany({
        select: {
          status: true,
          total: true,
          amountPaid: true,
          amountDue: true,
        },
      });

      let invoicedRevenue = new Decimal(0);
      let outstandingReceivables = new Decimal(0);

      for (const inv of invoices) {
        if (inv.status !== InvoiceStatus.DRAFT && inv.status !== InvoiceStatus.VOID) {
          invoicedRevenue = invoicedRevenue.plus(new Decimal(inv.total.toString()));
          outstandingReceivables = outstandingReceivables.plus(new Decimal(inv.amountDue.toString()));
        }
      }

      // 4. Payments Collection Aggregation
      const payments = await tx.payment.findMany({
        where: { status: PaymentStatus.SUCCEEDED },
        select: { amount: true },
      });

      let collectedRevenue = new Decimal(0);
      for (const p of payments) {
        collectedRevenue = collectedRevenue.plus(new Decimal(p.amount.toString()));
      }

      const canceledCount = await tx.subscription.count({
        where: { status: SubscriptionStatus.CANCELED },
      });

      return {
        mrr: totalMRR.toFixed(2),
        invoicedRevenue: invoicedRevenue.toFixed(2),
        collectedRevenue: collectedRevenue.toFixed(2),
        outstandingReceivables: outstandingReceivables.toFixed(2),
        activeSubscriptions: activeCount,
        trialingSubscriptions: trialingCount,
        canceledSubscriptions: canceledCount,
        totalInvoices: invoices.length,
      };
    });
  }
}
