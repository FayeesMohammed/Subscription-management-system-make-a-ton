import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { TenantContextService } from '../../database/tenant-context.service';
import { CreateCustomerSchema } from '@brightloop/validation';

@Injectable()
export class CustomersService {
  constructor(private readonly tenantContext: TenantContextService) {}

  async create(tenantId: string, input: unknown) {
    const parsed = CreateCustomerSchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors);
    }

    return this.tenantContext.withTenant(tenantId, async (tx) => {
      return tx.customer.create({
        data: {
          tenantId,
          ...parsed.data,
        },
      });
    });
  }

  async findAll(tenantId: string) {
    return this.tenantContext.withTenant(tenantId, async (tx) => {
      return tx.customer.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { subscriptions: true, invoices: true },
          },
        },
      });
    });
  }

  async findOne(tenantId: string, id: string) {
    return this.tenantContext.withTenant(tenantId, async (tx) => {
      const customer = await tx.customer.findUnique({
        where: { tenantId_id: { tenantId, id } },
        include: {
          subscriptions: {
            include: {
              items: {
                include: { price: true },
              },
            },
          },
          invoices: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!customer) {
        throw new NotFoundException(`Customer with ID ${id} not found`);
      }

      return customer;
    });
  }
}
