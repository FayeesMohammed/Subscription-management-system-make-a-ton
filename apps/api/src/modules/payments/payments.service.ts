import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TenantContextService } from '../../database/tenant-context.service';
import { RazorpayAdapter } from './razorpay.adapter';
import { PaymentStatus, InvoiceStatus, SubscriptionStatus } from '@brightloop/shared-types';
import { Decimal } from '@brightloop/financial-core';
import { Prisma } from '@prisma/client';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly razorpayAdapter: RazorpayAdapter,
  ) {}

  /**
   * Creates a payment attempt for an invoice.
   * Gateway call is deliberately kept outside the database transaction (Invariant 9).
   */
  async createPaymentAttempt(tenantId: string, invoiceId: string) {
    if (!invoiceId) {
      throw new BadRequestException('invoiceId is required to create a payment attempt');
    }

    const invoice = await this.tenantContext.withTenant(tenantId, async (tx) => {
      const inv = await tx.invoice.findUnique({
        where: { tenantId_id: { tenantId, id: invoiceId } },
        include: { customer: true },
      });
      if (!inv) {
        throw new NotFoundException(`Invoice with ID ${invoiceId} not found`);
      }
      return inv;
    });

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Invoice is already paid in full');
    }

    // Call external payment gateway adapter outside db transaction
    const gatewayOrder = await this.razorpayAdapter.createOrder({
      tenantId: invoice.tenantId,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      amount: new Decimal(invoice.amountDue.toString()),
      currency: invoice.currency,
      customerEmail: invoice.customer.email,
    });

    // Save payment attempt inside tenant context
    const attempt = await this.tenantContext.withTenant(tenantId, async (tx) => {
      return tx.paymentAttempt.create({
        data: {
          tenantId,
          invoiceId: invoice.id,
          gateway: gatewayOrder.gateway,
          gatewayOrderId: gatewayOrder.gatewayOrderId,
          amount: new Prisma.Decimal(gatewayOrder.amount),
          currency: gatewayOrder.currency,
          status: PaymentStatus.PENDING,
        },
      });
    });

    return {
      attemptId: attempt.id,
      gatewayOrderId: gatewayOrder.gatewayOrderId,
      amount: gatewayOrder.amount,
      currency: gatewayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_brightloop_key',
    };
  }

  /**
   * Processes verified payment gateway webhook.
   * Durable inbox, idempotency per provider event ID, amount verification, and outbox event.
   */
  async handleWebhook(rawBody: string, signature: string) {
    const verified = this.razorpayAdapter.verifySignature(rawBody, signature);
    if (!verified) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const payload = JSON.parse(rawBody);
    const eventId = payload.id || payload.event_id || `evt_${Date.now()}`;
    const eventType = payload.event || 'payment.captured';

    // 1. Webhook Inbox: Persist event or detect duplicate
    const existing = await this.prisma.webhookEvent.findUnique({
      where: {
        gateway_gatewayEventId: {
          gateway: 'razorpay',
          gatewayEventId: eventId,
        },
      },
    });

    if (existing) {
      this.logger.log(`Webhook event ${eventId} already recorded. Idempotent return.`);
      return { success: true, duplicate: true, status: existing.status };
    }

    const webhookEvent = await this.prisma.webhookEvent.create({
      data: {
        gateway: 'razorpay',
        gatewayEventId: eventId,
        eventType,
        payload,
        signatureVerified: true,
        status: 'received',
      },
    });

    // Only process payment.captured or order.paid
    if (eventType !== 'payment.captured' && eventType !== 'order.paid') {
      await this.prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: { status: 'ignored', processedAt: new Date() },
      });
      return { success: true, ignored: true };
    }

    const paymentEntity = payload.payload?.payment?.entity || payload;
    const gatewayPaymentId = paymentEntity.id || `pay_${Date.now()}`;
    const orderId = paymentEntity.order_id;
    const paidAmount = paymentEntity.amount
      ? new Decimal(paymentEntity.amount).dividedBy(100) // Razorpay minor units to major
      : new Decimal(0);
    const currency = (paymentEntity.currency || 'INR').toUpperCase();
    const tenantId = paymentEntity.notes?.tenantId;

    if (!tenantId) {
      await this.prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          status: 'failed',
          failureReason: 'Missing tenantId in payment notes metadata',
          processedAt: new Date(),
        },
      });
      return { success: false, reason: 'Missing tenant metadata' };
    }

    // Execute state update inside the verified tenant transaction
    await this.tenantContext.withTenant(tenantId, async (tx) => {
      const attempt = await tx.paymentAttempt.findFirst({
        where: { gatewayOrderId: orderId },
        include: { invoice: true },
      });

      if (!attempt) {
        await tx.webhookEvent.update({
          where: { id: webhookEvent.id },
          data: {
            status: 'failed',
            failureReason: `No payment attempt found matching order ${orderId}`,
            processedAt: new Date(),
          },
        });
        throw new NotFoundException(`No payment attempt matching order ${orderId}`);
      }

      const invoice = await tx.invoice.findUniqueOrThrow({
        where: { tenantId_id: { tenantId, id: attempt.invoiceId } },
      });

      // Financial check: Amount and currency verification
      if (invoice.currency !== currency || new Decimal(invoice.amountDue.toString()).lessThan(paidAmount)) {
        await tx.webhookEvent.update({
          where: { id: webhookEvent.id },
          data: {
            status: 'quarantined',
            failureReason: `Mismatch: Expected ${invoice.currency} ${invoice.amountDue}, received ${currency} ${paidAmount}`,
            processedAt: new Date(),
          },
        });
        throw new BadRequestException('Payment amount or currency mismatch. Event quarantined.');
      }

      // Check if this payment was already recorded
      const existingPayment = await tx.payment.findFirst({
        where: {
          tenantId,
          gatewayPaymentId,
        },
      });

      if (existingPayment) {
        return; // Idempotent
      }

      // Record successful payment
      await tx.payment.create({
        data: {
          tenantId,
          invoiceId: invoice.id,
          paymentAttemptId: attempt.id,
          gateway: 'razorpay',
          gatewayPaymentId,
          amount: new Prisma.Decimal(paidAmount.toString()),
          currency,
          status: PaymentStatus.SUCCEEDED,
          paidAt: new Date(),
        },
      });

      // Update payment attempt status
      await tx.paymentAttempt.update({
        where: { tenantId_id: { tenantId, id: attempt.id } },
        data: { status: PaymentStatus.SUCCEEDED },
      });

      // Update invoice amounts and status
      const newAmountPaid = new Decimal(invoice.amountPaid.toString()).plus(paidAmount);
      const newAmountDue = new Decimal(invoice.total.toString()).minus(newAmountPaid);
      const isFullyPaid = newAmountDue.lessThanOrEqualTo(0);

      await tx.invoice.update({
        where: { tenantId_id: { tenantId, id: invoice.id } },
        data: {
          amountPaid: new Prisma.Decimal(newAmountPaid.toString()),
          amountDue: new Prisma.Decimal(newAmountDue.toString()),
          status: isFullyPaid ? InvoiceStatus.PAID : invoice.status,
          paidAt: isFullyPaid ? new Date() : undefined,
        },
      });

      // If attached to a subscription, update subscription status to ACTIVE if it was past due
      if (invoice.subscriptionId && isFullyPaid) {
        const sub = await tx.subscription.findUnique({
          where: { tenantId_id: { tenantId, id: invoice.subscriptionId } },
        });

        if (sub && sub.status !== SubscriptionStatus.ACTIVE) {
          await tx.subscription.update({
            where: { tenantId_id: { tenantId, id: sub.id } },
            data: { status: SubscriptionStatus.ACTIVE },
          });

          await tx.subscriptionStatusLog.create({
            data: {
              tenantId,
              subscriptionId: sub.id,
              fromStatus: sub.status,
              toStatus: SubscriptionStatus.ACTIVE,
              reason: 'Payment succeeded via webhook',
              actor: 'webhook',
            },
          });
        }
      }

      // Mark webhook processed
      await tx.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          tenantId,
          status: 'processed',
          processedAt: new Date(),
        },
      });

      // Outbox event
      await tx.outboxEvent.create({
        data: {
          tenantId,
          eventType: 'payment.succeeded',
          payload: {
            invoiceId: invoice.id,
            gatewayPaymentId,
            amount: paidAmount.toString(),
            currency,
          },
        },
      });
    });

    return { success: true };
  }
}
