import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { TenantContextService } from '../../database/tenant-context.service';
import { InvoiceStatus } from '@brightloop/shared-types';
import { Prisma } from '@prisma/client';
import { Decimal } from '@brightloop/financial-core';

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
