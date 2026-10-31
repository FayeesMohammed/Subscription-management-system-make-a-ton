import { Injectable, Logger } from '@nestjs/common';
import { TenantContextService } from '../../database/tenant-context.service';
import { calculateItemMRR, Decimal } from '@brightloop/financial-core';
import { SubscriptionStatus, InvoiceStatus, PaymentStatus } from '@brightloop/shared-types';

@Injectable()
export class ReportingService {
  private readonly logger = new Logger(ReportingService.name);

  constructor(private readonly tenantContext: TenantContextService) {}

  // GAP-09: Sub-2-Second Finance Dashboard Reporting SLA
  async getMetrics(tenantId: string) {
    const startTime = performance.now();

    const metrics = await this.tenantContext.withTenant(tenantId, async (tx) => {
      // 1. Fetch active/trialing subscriptions using covering index idx_subscriptions_tenant_status
      const subscriptions = await tx.subscription.findMany({
        where: {
          status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING, SubscriptionStatus.CONFIRMED] },
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
      let confirmedCount = 0;

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
        } else if (sub.status === SubscriptionStatus.CONFIRMED) {
          confirmedCount++;
        }
      }

      // 3. Invoiced Revenue & Receivables Aggregations using idx_invoices_tenant_status_dueDate
      const invoices = await tx.invoice.findMany({
        select: {
          status: true,
          total: true,
          amountPaid: true,
          amountDue: true,
          dueDate: true,
        },
      });

      let invoicedRevenue = new Decimal(0);
      let outstandingReceivables = new Decimal(0);
      let overdueReceivables = new Decimal(0);
      const now = new Date();

      for (const inv of invoices) {
        if (inv.status !== InvoiceStatus.DRAFT && inv.status !== InvoiceStatus.VOID) {
          invoicedRevenue = invoicedRevenue.plus(new Decimal(inv.total.toString()));
          outstandingReceivables = outstandingReceivables.plus(new Decimal(inv.amountDue.toString()));

          if (inv.dueDate < now && new Decimal(inv.amountDue.toString()).greaterThan(0)) {
            overdueReceivables = overdueReceivables.plus(new Decimal(inv.amountDue.toString()));
          }
        }
      }

      // 4. Payments Collection Aggregation using idx_payments_tenant_paymentDate
      const payments = await tx.payment.findMany({
        where: { status: PaymentStatus.SUCCEEDED },
        select: { amount: true, paymentMethod: true },
      });

      let collectedRevenue = new Decimal(0);
      let gatewayRevenue = new Decimal(0);
      let offlineRevenue = new Decimal(0);

      for (const p of payments) {
        const amt = new Decimal(p.amount.toString());
        collectedRevenue = collectedRevenue.plus(amt);
        if (p.paymentMethod === 'GATEWAY') {
          gatewayRevenue = gatewayRevenue.plus(amt);
        } else {
          offlineRevenue = offlineRevenue.plus(amt);
        }
      }

      const closedCount = await tx.subscription.count({
        where: { status: { in: [SubscriptionStatus.CLOSED, SubscriptionStatus.CANCELED] } },
      });

      return {
        mrr: totalMRR.toFixed(2),
        invoicedRevenue: invoicedRevenue.toFixed(2),
        collectedRevenue: collectedRevenue.toFixed(2),
        outstandingReceivables: outstandingReceivables.toFixed(2),
        overdueReceivables: overdueReceivables.toFixed(2),
        activeSubscriptions: activeCount,
        trialingSubscriptions: trialingCount,
        confirmedSubscriptions: confirmedCount,
        closedSubscriptions: closedCount,
        totalInvoices: invoices.length,
        paymentBreakdown: {
          gateway: gatewayRevenue.toFixed(2),
          manualOffline: offlineRevenue.toFixed(2),
        },
      };
    });

    const executionDurationMs = Math.round(performance.now() - startTime);
    if (executionDurationMs > 500) {
      this.logger.warn(`Reporting SLA Warning: Query took ${executionDurationMs}ms (Threshold: 500ms)`);
    }

    return {
      ...metrics,
      slaStatus: executionDurationMs < 2000 ? 'PASSED_SUB_2_SECOND' : 'EXCEEDED',
      executionDurationMs,
    };
  }
}
