import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { TenantContextService } from '../../database/tenant-context.service';
import {
  CreateSubscriptionSchema,
  CreateQuotationSchema,
  CreateQuotationTemplateSchema,
} from '@brightloop/validation';
import {
  SubscriptionStatus,
  InvoiceStatus,
} from '@brightloop/shared-types';
import { calculateLineItem, Decimal } from '@brightloop/financial-core';
import { Prisma } from '@prisma/client';
import { DiscountsService } from '../discounts/discounts.service';

const ALLOWED_TRANSITIONS: Record<SubscriptionStatus, SubscriptionStatus[]> = {
  [SubscriptionStatus.DRAFT]: [SubscriptionStatus.QUOTATION, SubscriptionStatus.CONFIRMED, SubscriptionStatus.CLOSED],
  [SubscriptionStatus.QUOTATION]: [SubscriptionStatus.CONFIRMED, SubscriptionStatus.CLOSED],
  [SubscriptionStatus.CONFIRMED]: [SubscriptionStatus.ACTIVE, SubscriptionStatus.CLOSED],
  [SubscriptionStatus.INCOMPLETE]: [SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCELED],
  [SubscriptionStatus.TRIALING]: [SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCELED, SubscriptionStatus.PAST_DUE],
  [SubscriptionStatus.ACTIVE]: [SubscriptionStatus.PAST_DUE, SubscriptionStatus.PAUSED, SubscriptionStatus.CLOSED, SubscriptionStatus.CANCELED],
  [SubscriptionStatus.PAST_DUE]: [SubscriptionStatus.ACTIVE, SubscriptionStatus.UNPAID, SubscriptionStatus.CLOSED, SubscriptionStatus.CANCELED],
  [SubscriptionStatus.PAUSED]: [SubscriptionStatus.ACTIVE, SubscriptionStatus.CLOSED, SubscriptionStatus.CANCELED],
  [SubscriptionStatus.UNPAID]: [SubscriptionStatus.ACTIVE, SubscriptionStatus.CLOSED, SubscriptionStatus.CANCELED],
  [SubscriptionStatus.CLOSED]: [], // Terminal state
  [SubscriptionStatus.CANCELED]: [], // Terminal state
};

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly discountsService: DiscountsService,
  ) {}

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

  // GAP-05: Quotation template management
  async createTemplate(tenantId: string, input: unknown) {
    const parsed = CreateQuotationTemplateSchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors);
    }
    const data = parsed.data;

    return this.tenantContext.withTenant(tenantId, async (tx) => {
      return tx.quotationTemplate.create({
        data: {
          tenantId,
          name: data.name,
          validForDays: data.validForDays,
          lines: {
            create: data.lines?.map((l) => ({
              tenantId,
              productId: l.productId,
              variantId: l.variantId,
              quantity: l.quantity,
            })),
          },
        },
        include: { lines: true },
      });
    });
  }

  async listTemplates(tenantId: string) {
    return this.tenantContext.withTenant(tenantId, async (tx) => {
      return tx.quotationTemplate.findMany({
        include: { lines: true },
      });
    });
  }

  // GAP-05: Sales Quotations with validity window
  async createQuotation(tenantId: string, input: unknown) {
    const parsed = CreateQuotationSchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors);
    }
    const { customerId, priceId, variantId, quantity, validForDays, discountCode } = parsed.data;

    return this.tenantContext.withTenant(tenantId, async (tx) => {
      const customer = await tx.customer.findUnique({
        where: { tenantId_id: { tenantId, id: customerId } },
      });
      if (!customer) throw new NotFoundException(`Customer ${customerId} not found`);

      const price = await tx.price.findUnique({
        where: { tenantId_id: { tenantId, id: priceId } },
        include: { product: true },
      });
      if (!price) throw new NotFoundException(`Price ${priceId} not found`);

      // Plan schedule constraints
      if (quantity < price.minQuantity) {
        throw new BadRequestException(`Minimum required quantity for this plan is ${price.minQuantity}`);
      }

      const now = new Date();
      const expiryDate = new Date(now.getTime() + validForDays * 24 * 60 * 60 * 1000);
      const periodEnd = this.calculatePeriodEnd(now, price.billingInterval, price.billingIntervalCount);

      const quote = await tx.subscription.create({
        data: {
          tenantId,
          customerId,
          status: SubscriptionStatus.QUOTATION,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          expiryDate,
          autoClose: price.autoClose,
          items: {
            create: {
              tenantId,
              priceId,
              variantId,
              quantity,
            },
          },
          statusLogs: {
            create: {
              tenantId,
              fromStatus: SubscriptionStatus.DRAFT,
              toStatus: SubscriptionStatus.QUOTATION,
              reason: `Sales quotation created valid for ${validForDays} days`,
              actor: 'sales',
            },
          },
        },
        include: {
          items: { include: { price: { include: { product: true } } } },
          customer: true,
        },
      });

      return quote;
    });
  }

  // GAP-05: Customer approves quotation -> Confirmed
  async confirmQuotation(tenantId: string, subscriptionId: string) {
    return this.tenantContext.withTenant(tenantId, async (tx) => {
      const sub = await tx.subscription.findUniqueOrThrow({
        where: { tenantId_id: { tenantId, id: subscriptionId } },
      });

      if (sub.status !== SubscriptionStatus.QUOTATION && sub.status !== SubscriptionStatus.DRAFT) {
        throw new BadRequestException(`Subscription is in status '${sub.status}', expected 'quotation' or 'draft'`);
      }

      if (sub.expiryDate && sub.expiryDate < new Date()) {
        await tx.subscription.update({
          where: { tenantId_id: { tenantId, id: subscriptionId } },
          data: { status: SubscriptionStatus.CLOSED },
        });
        throw new BadRequestException('Quotation has expired and cannot be confirmed');
      }

      return tx.subscription.update({
        where: { tenantId_id: { tenantId, id: subscriptionId } },
        data: {
          status: SubscriptionStatus.CONFIRMED,
          statusLogs: {
            create: {
              tenantId,
              fromStatus: sub.status,
              toStatus: SubscriptionStatus.CONFIRMED,
              reason: 'Quotation approved by customer',
              actor: 'customer',
            },
          },
        },
        include: { items: { include: { price: true } }, customer: true },
      });
    });
  }

  // GAP-05: Activate subscription on billing start date -> Generates invoice
  async activateSubscription(tenantId: string, subscriptionId: string) {
    return this.tenantContext.withTenant(tenantId, async (tx) => {
      const sub = await tx.subscription.findUniqueOrThrow({
        where: { tenantId_id: { tenantId, id: subscriptionId } },
      });

      const updated = await tx.subscription.update({
        where: { tenantId_id: { tenantId, id: subscriptionId } },
        data: {
          status: SubscriptionStatus.ACTIVE,
          statusLogs: {
            create: {
              tenantId,
              fromStatus: sub.status,
              toStatus: SubscriptionStatus.ACTIVE,
              reason: 'Subscription activated',
              actor: 'system',
            },
          },
        },
        include: { items: { include: { price: true } }, customer: true },
      });

      const invoice = await this.generateInvoiceForPeriod(tx, tenantId, subscriptionId);
      return { subscription: updated, invoice };
    });
  }

  // GAP-04 & GAP-05: Close subscription (early close or auto-close)
  async closeSubscription(tenantId: string, subscriptionId: string, reason = 'Term ended or early close') {
    return this.tenantContext.withTenant(tenantId, async (tx) => {
      const sub = await tx.subscription.findUniqueOrThrow({
        where: { tenantId_id: { tenantId, id: subscriptionId } },
      });

      return tx.subscription.update({
        where: { tenantId_id: { tenantId, id: subscriptionId } },
        data: {
          status: SubscriptionStatus.CLOSED,
          statusLogs: {
            create: {
              tenantId,
              fromStatus: sub.status,
              toStatus: SubscriptionStatus.CLOSED,
              reason,
              actor: 'system',
            },
          },
        },
      });
    });
  }

  async create(tenantId: string, input: unknown) {
    const parsed = CreateSubscriptionSchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors);
    }
    const { customerId, priceId, variantId, quantity, trialPeriodDays, discountCode } = parsed.data;

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

      // GAP-04: Minimum quantity validation
      if (quantity < price.minQuantity) {
        throw new BadRequestException(`Minimum quantity for this plan is ${price.minQuantity}`);
      }

      // Plan availability window check
      const now = new Date();
      if (price.startDate && price.startDate > now) {
        throw new BadRequestException('This plan is not available yet');
      }
      if (price.endDate && price.endDate < now) {
        throw new BadRequestException('This plan is no longer available');
      }

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
          autoClose: price.autoClose,
          items: {
            create: {
              tenantId,
              priceId,
              variantId,
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
        firstInvoice = await this.generateInvoiceForPeriod(tx, tenantId, subscription.id, discountCode);
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
   * Integrates GAP-07 Discount Engine.
   */
  async generateInvoiceForPeriod(
    tx: Prisma.TransactionClient,
    tenantId: string,
    subscriptionId: string,
    discountCode?: string,
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

    // GAP-07: Automatic discount calculation if discountCode supplied
    let discountTotal = new Decimal(0);
    if (discountCode) {
      const discountEvaluation = await this.discountsService.evaluateDiscount(
        tx,
        tenantId,
        discountCode,
        subtotal,
        sub.items.reduce((acc, i) => acc + i.quantity, 0),
      );
      if (discountEvaluation.valid) {
        discountTotal = discountEvaluation.discountAmount;
        total = total.minus(discountTotal);
        if (discountEvaluation.discountId) {
          await tx.discount.update({
            where: { tenantId_id: { tenantId, id: discountEvaluation.discountId } },
            data: { currentUsageCount: { increment: 1 } },
          });
        }
      }
    }

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
        discountTotal: new Prisma.Decimal(discountTotal.toString()),
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
