import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { TenantContextService } from '../../database/tenant-context.service';
import { CreateSubscriptionSchema } from '@brightloop/validation';
import {
  SubscriptionStatus,
  InvoiceStatus,
  TenantRole,
} from '@brightloop/shared-types';
import { calculateLineItem, Decimal } from '@brightloop/financial-core';
import { Prisma } from '@prisma/client';

const ALLOWED_TRANSITIONS: Record<SubscriptionStatus, SubscriptionStatus[]> = {
  [SubscriptionStatus.INCOMPLETE]: [SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCELED],
  [SubscriptionStatus.TRIALING]: [SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCELED, SubscriptionStatus.PAST_DUE],
  [SubscriptionStatus.ACTIVE]: [SubscriptionStatus.PAST_DUE, SubscriptionStatus.PAUSED, SubscriptionStatus.CANCELED],
  [SubscriptionStatus.PAST_DUE]: [SubscriptionStatus.ACTIVE, SubscriptionStatus.UNPAID, SubscriptionStatus.CANCELED],
  [SubscriptionStatus.PAUSED]: [SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCELED],
  [SubscriptionStatus.UNPAID]: [SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCELED],
  [SubscriptionStatus.CANCELED]: [], // Terminal state
};

@Injectable()
export class SubscriptionsService {
  constructor(private readonly tenantContext: TenantContextService) {}

  private calculatePeriodEnd(start: Date, interval: string, count = 1): Date {
    const end = new Date(start.getTime());
    switch (interval) {
      case 'day':
        end.setDate(end.getDate() + count);
        break;
      case 'week':
        end.setDate(end.getDate() + 7 * count);
        break;
      case 'month':
        end.setMonth(end.getMonth() + count);
        break;
      case 'year':
        end.setFullYear(end.getFullYear() + count);
        break;
      default:
        end.setMonth(end.getMonth() + 1);
    }
    return end;
  }

  async create(tenantId: string, input: unknown) {
    const parsed = CreateSubscriptionSchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors);
    }
    const { customerId, priceId, quantity, trialPeriodDays } = parsed.data;

    return this.tenantContext.withTenant(tenantId, async (tx) => {
      // Validate customer belongs to tenant
      const customer = await tx.customer.findUnique({
        where: { tenantId_id: { tenantId, id: customerId } },
      });
      if (!customer) {
        throw new NotFoundException(`Customer ${customerId} not found`);
      }

      // Validate price belongs to tenant
      const price = await tx.price.findUnique({
        where: { tenantId_id: { tenantId, id: priceId } },
        include: { product: true },
      });
      if (!price) {
        throw new NotFoundException(`Price ${priceId} not found`);
      }

      const now = new Date();
      const periodEnd = this.calculatePeriodEnd(now, price.billingInterval, price.billingIntervalCount);

      let status = SubscriptionStatus.ACTIVE;
      let trialStart: Date | null = null;
      let trialEnd: Date | null = null;

      if (trialPeriodDays > 0) {
        status = SubscriptionStatus.TRIALING;
        trialStart = now;
        trialEnd = new Date(now.getTime() + trialPeriodDays * 24 * 60 * 60 * 1000);
      }

      // Create subscription
      const subscription = await tx.subscription.create({
        data: {
          tenantId,
          customerId,
          status,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          trialStart,
          trialEnd,
          items: {
            create: {
              tenantId,
              priceId,
              quantity,
            },
          },
          statusLogs: {
            create: {
              tenantId,
              fromStatus: SubscriptionStatus.INCOMPLETE,
              toStatus: status,
              reason: trialPeriodDays > 0 ? 'Subscription created with trial' : 'Subscription created directly active',
              actor: 'system',
            },
          },
        },
        include: {
          items: { include: { price: true } },
          customer: true,
        },
      });

      // If active (not trialing), generate the immutable invoice for the first period
      let firstInvoice = null;
      if (status === SubscriptionStatus.ACTIVE) {
        firstInvoice = await this.generateInvoiceForPeriod(tx, tenantId, subscription.id);
      }

      return {
        subscription,
        invoice: firstInvoice,
      };
    });
  }

  async findAll(tenantId: string, customerId?: string) {
    return this.tenantContext.withTenant(tenantId, async (tx) => {
      return tx.subscription.findMany({
        where: customerId ? { customerId } : undefined,
        include: {
          customer: true,
          items: { include: { price: { include: { product: true } } } },
          invoices: { orderBy: { createdAt: 'desc' }, take: 5 },
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  }

  async findOne(tenantId: string, id: string) {
    return this.tenantContext.withTenant(tenantId, async (tx) => {
      const sub = await tx.subscription.findUnique({
        where: { tenantId_id: { tenantId, id } },
        include: {
          customer: true,
          items: { include: { price: { include: { product: true } } } },
          statusLogs: { orderBy: { createdAt: 'desc' } },
          invoices: { orderBy: { createdAt: 'desc' } },
        },
      });

      if (!sub) {
        throw new NotFoundException(`Subscription ${id} not found`);
      }

      return sub;
    });
  }

  async transition(
    tenantId: string,
    subscriptionId: string,
    toStatus: SubscriptionStatus,
    reason?: string,
    actor = 'user',
  ) {
    return this.tenantContext.withTenant(tenantId, async (tx) => {
      const sub = await tx.subscription.findUniqueOrThrow({
        where: { tenantId_id: { tenantId, id: subscriptionId } },
      });

      const allowed = ALLOWED_TRANSITIONS[sub.status as SubscriptionStatus] || [];
      if (!allowed.includes(toStatus)) {
        throw new BadRequestException(
          `Invalid subscription status transition from '${sub.status}' to '${toStatus}'`,
        );
      }

      const updated = await tx.subscription.update({
        where: { tenantId_id: { tenantId, id: subscriptionId } },
        data: {
          status: toStatus,
          pausedAt: toStatus === SubscriptionStatus.PAUSED ? new Date() : undefined,
          canceledAt: toStatus === SubscriptionStatus.CANCELED ? new Date() : undefined,
          statusLogs: {
            create: {
              tenantId,
              fromStatus: sub.status as SubscriptionStatus,
              toStatus,
              reason: reason || `Manual transition to ${toStatus}`,
              actor,
            },
          },
        },
        include: { statusLogs: { orderBy: { createdAt: 'desc' }, take: 5 } },
      });

      return updated;
    });
  }

  async cancel(tenantId: string, subscriptionId: string, immediately = false) {
    return this.tenantContext.withTenant(tenantId, async (tx) => {
      const sub = await tx.subscription.findUniqueOrThrow({
        where: { tenantId_id: { tenantId, id: subscriptionId } },
      });

      if (immediately) {
        return this.transition(tenantId, subscriptionId, SubscriptionStatus.CANCELED, 'Canceled immediately', 'user');
      } else {
        return tx.subscription.update({
          where: { tenantId_id: { tenantId, id: subscriptionId } },
          data: { cancelAtPeriodEnd: true },
        });
      }
    });
  }

  /**
   * Generates a finalized, immutable invoice for a subscription's current billing period.
   * Enforces idempotency per billing period.
   */
  async generateInvoiceForPeriod(
    tx: Prisma.TransactionClient,
    tenantId: string,
    subscriptionId: string,
  ) {
    const sub = await tx.subscription.findUniqueOrThrow({
      where: { tenantId_id: { tenantId, id: subscriptionId } },
      include: {
        customer: true,
        items: { include: { price: { include: { product: true } } } },
      },
    });

    const periodKey = `sub_${sub.id}_${sub.currentPeriodStart.toISOString().split('T')[0]}_${sub.currentPeriodEnd.toISOString().split('T')[0]}`;

    // Check if invoice already exists for this billing period (Idempotency)
    const existing = await tx.invoice.findUnique({
      where: {
        tenantId_idempotencyKey: {
          tenantId,
          idempotencyKey: periodKey,
        },
      },
      include: { lines: true },
    });

    if (existing) {
      return existing;
    }

    // Allocate tenant-scoped sequence number atomically
    const currentYear = new Date().getFullYear();
    const seq = await tx.invoiceSequence.upsert({
      where: {
        tenantId_prefix_year: {
          tenantId,
          prefix: 'INV',
          year: currentYear,
        },
      },
      update: {
        currentNumber: { increment: 1 },
      },
      create: {
        tenantId,
        prefix: 'INV',
        year: currentYear,
        currentNumber: 1,
      },
    });

    const invoiceNumber = `INV-${currentYear}-${seq.currentNumber.toString().padStart(6, '0')}`;

    // Calculate line items using financial core (Decimal arithmetic)
    let subtotal = new Decimal(0);
    let taxTotal = new Decimal(0);
    let total = new Decimal(0);

    const lineItemInputs = sub.items.map((item) => {
      const calc = calculateLineItem({
        unitPrice: item.price.unitAmount.toString(),
        quantity: item.quantity,
        taxRatePercentage: item.price.taxRatePercentage.toString(),
      });

      subtotal = subtotal.plus(calc.netAmount);
      taxTotal = taxTotal.plus(calc.taxAmount);
      total = total.plus(calc.totalAmount);

      return {
        tenantId,
        description: `${item.price.product.name} - ${item.price.nickname || item.price.billingInterval} subscription`,
        unitPrice: new Prisma.Decimal(item.price.unitAmount.toString()),
        quantity: new Prisma.Decimal(item.quantity.toString()),
        grossAmount: new Prisma.Decimal(calc.grossAmount.toString()),
        discountAmount: new Prisma.Decimal(calc.discountAmount.toString()),
        netAmount: new Prisma.Decimal(calc.netAmount.toString()),
        taxRate: new Prisma.Decimal(item.price.taxRatePercentage.toString()),
        taxAmount: new Prisma.Decimal(calc.taxAmount.toString()),
        totalAmount: new Prisma.Decimal(calc.totalAmount.toString()),
        priceSnapshot: {
          priceId: item.price.id,
          version: item.price.version,
          unitAmount: item.price.unitAmount.toString(),
          currency: item.price.currency,
          taxRate: item.price.taxRatePercentage.toString(),
        },
      };
    });

    const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days payment term

    // Transactionally create invoice with lines and finalized status
    const invoice = await tx.invoice.create({
      data: {
        tenantId,
        customerId: sub.customerId,
        subscriptionId: sub.id,
        invoiceNumber,
        status: InvoiceStatus.FINALIZED,
        currency: sub.items[0]?.price.currency || 'INR',
        subtotal: new Prisma.Decimal(subtotal.toString()),
        discountTotal: new Prisma.Decimal(0),
        taxTotal: new Prisma.Decimal(taxTotal.toString()),
        total: new Prisma.Decimal(total.toString()),
        amountPaid: new Prisma.Decimal(0),
        amountDue: new Prisma.Decimal(total.toString()),
        dueDate,
        periodStart: sub.currentPeriodStart,
        periodEnd: sub.currentPeriodEnd,
        finalizedAt: new Date(),
        idempotencyKey: periodKey,
        lines: {
          create: lineItemInputs,
        },
      },
      include: {
        lines: true,
      },
    });

    // Write domain event to transactional outbox
    await tx.outboxEvent.create({
      data: {
        tenantId,
        eventType: 'invoice.finalized',
        payload: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          total: invoice.total.toString(),
          currency: invoice.currency,
          customerId: invoice.customerId,
        },
      },
    });

    return invoice;
  }
}
