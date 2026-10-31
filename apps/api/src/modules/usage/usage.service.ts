import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { TenantContextService } from '../../database/tenant-context.service';
import { UsageEventIngestionSchema } from '@brightloop/validation';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsageService {
  constructor(private readonly tenantContext: TenantContextService) {}

  async createMeter(
    tenantId: string,
    data: { code: string; name: string; unit: string; aggregationType?: string },
  ) {
    return this.tenantContext.withTenant(tenantId, async (tx) => {
      return tx.meter.create({
        data: {
          tenantId,
          code: data.code,
          name: data.name,
          unit: data.unit,
          aggregationType: data.aggregationType || 'sum',
        },
      });
    });
  }

  async listMeters(tenantId: string) {
    return this.tenantContext.withTenant(tenantId, async (tx) => {
      return tx.meter.findMany({
        orderBy: { createdAt: 'desc' },
      });
    });
  }

  async recordUsageEvent(tenantId: string, input: unknown) {
    const parsed = UsageEventIngestionSchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors);
    }
    const data = parsed.data;

    return this.tenantContext.withTenant(tenantId, async (tx) => {
      // Find meter
      const meter = await tx.meter.findUnique({
        where: {
          tenantId_code: {
            tenantId,
            code: data.meterCode,
          },
        },
      });

      if (!meter) {
        throw new NotFoundException(`Meter with code '${data.meterCode}' not found`);
      }

      // Check customer
      const customer = await tx.customer.findUnique({
        where: { id: data.customerId },
      });
      if (!customer) {
        throw new NotFoundException(`Customer ${data.customerId} not found`);
      }

      // Idempotent insertion
      const existing = await tx.usageEvent.findUnique({
        where: {
          tenantId_idempotencyKey: {
            tenantId,
            idempotencyKey: data.idempotencyKey,
          },
        },
      });

      if (existing) {
        return { event: existing, deduplicated: true };
      }

      const event = await tx.usageEvent.create({
        data: {
          tenantId,
          meterId: meter.id,
          customerId: data.customerId,
          idempotencyKey: data.idempotencyKey,
          quantity: new Prisma.Decimal(data.quantity),
          timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
        },
      });

      return { event, deduplicated: false };
    });
  }

  async aggregateUsage(
    tenantId: string,
    meterCode: string,
    customerId: string,
    periodStart: Date,
    periodEnd: Date,
  ) {
    return this.tenantContext.withTenant(tenantId, async (tx) => {
      const meter = await tx.meter.findUniqueOrThrow({
        where: { tenantId_code: { tenantId, code: meterCode } },
      });

      const events = await tx.usageEvent.findMany({
        where: {
          meterId: meter.id,
          customerId,
          timestamp: {
            gte: periodStart,
            lte: periodEnd,
          },
        },
      });

      const totalQuantity = events.reduce(
        (sum, evt) => sum.plus(new Prisma.Decimal(evt.quantity)),
        new Prisma.Decimal(0),
      );

      return {
        meterCode,
        customerId,
        totalQuantity: totalQuantity.toString(),
        eventCount: events.length,
        periodStart,
        periodEnd,
      };
    });
  }
}
