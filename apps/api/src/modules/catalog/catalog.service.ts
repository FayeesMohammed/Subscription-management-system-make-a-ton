import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { TenantContextService } from '../../database/tenant-context.service';
import { CreateProductSchema, CreatePriceSchema } from '@brightloop/validation';
import { Prisma } from '@prisma/client';

@Injectable()
export class CatalogService {
  constructor(private readonly tenantContext: TenantContextService) {}

  async createProduct(tenantId: string, input: unknown) {
    const parsed = CreateProductSchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors);
    }

    return this.tenantContext.withTenant(tenantId, async (tx) => {
      return tx.product.create({
        data: {
          tenantId,
          ...parsed.data,
        },
      });
    });
  }

  async findAllProducts(tenantId: string) {
    return this.tenantContext.withTenant(tenantId, async (tx) => {
      return tx.product.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          prices: {
            where: { active: true },
          },
        },
      });
    });
  }

  async createPrice(tenantId: string, input: unknown) {
    const parsed = CreatePriceSchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors);
    }
    const data = parsed.data;

    return this.tenantContext.withTenant(tenantId, async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: data.productId },
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${data.productId} not found`);
      }

      return tx.price.create({
        data: {
          tenantId,
          productId: data.productId,
          nickname: data.nickname,
          currency: data.currency.toUpperCase(),
          unitAmount: new Prisma.Decimal(data.unitAmount),
          billingInterval: data.billingInterval,
          billingIntervalCount: data.billingIntervalCount,
          pricingModel: data.pricingModel,
          taxRatePercentage: new Prisma.Decimal(data.taxRatePercentage),
        },
      });
    });
  }

  async findAllPrices(tenantId: string, productId?: string) {
    return this.tenantContext.withTenant(tenantId, async (tx) => {
      return tx.price.findMany({
        where: productId ? { productId } : undefined,
        include: { product: true },
        orderBy: { createdAt: 'desc' },
      });
    });
  }
}
