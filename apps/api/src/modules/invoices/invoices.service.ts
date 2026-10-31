import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { TenantContextService } from '../../database/tenant-context.service';
import { InvoiceStatus, PaymentMethod, PaymentStatus } from '@brightloop/shared-types';
import { Prisma } from '@prisma/client';
import { Decimal } from '@brightloop/financial-core';
import { RecordManualPaymentSchema } from '@brightloop/validation';

@Injectable()
export class InvoicesService {
  constructor(private readonly tenantContext: TenantContextService) {}

  async findAll(tenantId: string, customerId?: string, status?: string) {
    return this.tenantContext.withTenant(tenantId, async (tx) => {
      return tx.invoice.findMany({
        where: {
          customerId: customerId || undefined,
          status: status ? (status as any) : undefined,
        },
        include: {
          customer: true,
          lines: true,
          payments: true,
          creditNotes: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  }

  async findOne(tenantId: string, id: string) {
    return this.tenantContext.withTenant(tenantId, async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { tenantId_id: { tenantId, id } },
        include: {
          customer: true,
          lines: true,
          payments: true,
          paymentAttempts: true,
          creditNotes: true,
        },
      });

      if (!invoice) {
        throw new NotFoundException(`Invoice with ID ${id} not found`);
      }

      return invoice;
    });
  }

  // GAP-06: Confirm draft invoice -> locks financial snapshot
  async confirmInvoice(tenantId: string, id: string) {
    return this.tenantContext.withTenant(tenantId, async (tx) => {
      const invoice = await tx.invoice.findUniqueOrThrow({
        where: { tenantId_id: { tenantId, id } },
      });

      if (invoice.status === InvoiceStatus.FINALIZED || invoice.status === InvoiceStatus.CONFIRMED) {
        return invoice;
      }

      if (invoice.status !== InvoiceStatus.DRAFT) {
        throw new BadRequestException(`Invoice is already ${invoice.status}`);
      }

      return tx.invoice.update({
        where: { tenantId_id: { tenantId, id } },
        data: {
          status: InvoiceStatus.CONFIRMED,
          finalizedAt: new Date(),
        },
      });
    });
  }

  // GAP-06: Void invoice
  async voidInvoice(tenantId: string, id: string, reason?: string) {
    return this.tenantContext.withTenant(tenantId, async (tx) => {
      const invoice = await tx.invoice.findUniqueOrThrow({
        where: { tenantId_id: { tenantId, id } },
      });

      if (invoice.status === InvoiceStatus.PAID) {
        throw new BadRequestException('Cannot void an invoice that is already paid. Issue a credit note instead.');
      }

      return tx.invoice.update({
        where: { tenantId_id: { tenantId, id } },
        data: {
          status: InvoiceStatus.VOID,
        },
      });
    });
  }

  // GAP-08: Log manual payment (Cash, Bank Transfer, Cheque)
  async recordManualPayment(tenantId: string, invoiceId: string, input: unknown, userId?: string) {
    const parsed = RecordManualPaymentSchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors);
    }
    const data = parsed.data;

    return this.tenantContext.withTenant(tenantId, async (tx) => {
      const invoice = await tx.invoice.findUniqueOrThrow({
        where: { tenantId_id: { tenantId, id: invoiceId } },
      });

      if (invoice.status === InvoiceStatus.PAID) {
        throw new BadRequestException('Invoice is already fully paid');
      }

      const paymentAmount = new Decimal(data.amount);
      const remainingDue = new Decimal(invoice.amountDue.toString());

      if (paymentAmount.greaterThan(remainingDue)) {
        throw new BadRequestException(`Payment amount of ${paymentAmount} exceeds balance due of ${remainingDue}`);
      }

      const payment = await tx.payment.create({
        data: {
          tenantId,
          invoiceId: invoice.id,
          amount: new Prisma.Decimal(paymentAmount.toString()),
          currency: invoice.currency,
          paymentMethod: data.paymentMethod as any,
          referenceNote: data.referenceNote,
          recordedBy: userId,
          paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
          status: PaymentStatus.SUCCEEDED,
        },
      });

      const newAmountPaid = new Decimal(invoice.amountPaid.toString()).plus(paymentAmount);
      const newAmountDue = remainingDue.minus(paymentAmount);
      const isFullyPaid = newAmountDue.lessThanOrEqualTo(0);

      const updatedInvoice = await tx.invoice.update({
        where: { tenantId_id: { tenantId, id: invoice.id } },
        data: {
          amountPaid: new Prisma.Decimal(newAmountPaid.toString()),
          amountDue: new Prisma.Decimal(newAmountDue.toString()),
          status: isFullyPaid ? InvoiceStatus.PAID : invoice.status,
          paidAt: isFullyPaid ? new Date() : undefined,
        },
      });

      return {
        payment,
        invoice: updatedInvoice,
      };
    });
  }

  // GAP-08: Receivables tracking - Overdue confirmed invoices
  async getOverdueInvoices(tenantId: string) {
    return this.tenantContext.withTenant(tenantId, async (tx) => {
      return tx.invoice.findMany({
        where: {
          status: { in: [InvoiceStatus.CONFIRMED, InvoiceStatus.FINALIZED] },
          dueDate: { lt: new Date() },
          amountDue: { gt: 0 },
        },
        include: { customer: true },
        orderBy: { dueDate: 'asc' },
      });
    });
  }

  /**
   * Corrects a finalized invoice via a credit note adjustment.
   * Preserves invariant 7: issued invoices are never mutated directly!
   */
  async createCreditNote(
    tenantId: string,
    invoiceId: string,
    amountStr: string,
    reason: string,
  ) {
    return this.tenantContext.withTenant(tenantId, async (tx) => {
      const invoice = await tx.invoice.findUniqueOrThrow({
        where: { tenantId_id: { tenantId, id: invoiceId } },
        include: { creditNotes: true },
      });

      if (invoice.status === InvoiceStatus.DRAFT) {
        throw new BadRequestException('Cannot issue credit note against draft invoice');
      }

      const creditAmount = new Decimal(amountStr);
      if (creditAmount.lessThanOrEqualTo(0)) {
        throw new BadRequestException('Credit note amount must be positive');
      }

      const totalExistingCredits = invoice.creditNotes.reduce(
        (acc, cn) => acc.plus(new Decimal(cn.amount.toString())),
        new Decimal(0),
      );

      const maxAllowedCredit = new Decimal(invoice.total.toString()).minus(totalExistingCredits);
      if (creditAmount.greaterThan(maxAllowedCredit)) {
        throw new BadRequestException(`Credit note amount exceeds refundable total. Remaining refundable: ${maxAllowedCredit}`);
      }

      const currentYear = new Date().getFullYear();
      const cnNumber = `CN-${currentYear}-${Date.now().toString().slice(-6)}`;

      const creditNote = await tx.creditNote.create({
        data: {
          tenantId,
          invoiceId,
          creditNoteNumber: cnNumber,
          amount: new Prisma.Decimal(creditAmount.toString()),
          currency: invoice.currency,
          reason: reason || 'Adjustment/Correction',
        },
      });

      // Write domain outbox event
      await tx.outboxEvent.create({
        data: {
          tenantId,
          eventType: 'credit_note.created',
          payload: {
            creditNoteId: creditNote.id,
            creditNoteNumber: creditNote.creditNoteNumber,
            invoiceId: invoice.id,
            amount: creditNote.amount.toString(),
            currency: creditNote.currency,
          },
        },
      });

      return creditNote;
    });
  }
}
