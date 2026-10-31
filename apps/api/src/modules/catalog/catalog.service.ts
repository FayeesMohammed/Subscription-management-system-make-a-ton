import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { TenantContextService } from '../../database/tenant-context.service';
import { CreateProductSchema, CreateProductVariantSchema, CreatePriceSchema } from '@brightloop/validation';
import { Prisma } from '@prisma/client';

@Injectable()
export class CatalogService {
  constructor(private readonly tenantContext: TenantContextService) {}

  async createProduct(tenantId: string, input: unknown) {
    const parsed = CreateProductSchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors);
    }
    const data = parsed.data;

    return this.tenantContext.withTenant(tenantId, async (tx) => {
      return tx.product.create({
        data: {
          tenantId,
          name: data.name,
          type: data.type as any,
          salesPrice: new Prisma.Decimal(data.salesPrice),
          costPrice: new Prisma.Decimal(data.costPrice),
          notes: data.notes,
          description: data.description,
          active: data.active,
        },
      });
    });
  }

  async findAllProducts(tenantId: string) {
    return this.tenantContext.withTenant(tenantId, async (tx) => {
      return tx.product.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          variants: true,
          prices: {
            where: { active: true },
          },
        },
      });
    });
  }

  // GAP-03: Create Product Variant (e.g., Odoo Brand Variant +560.00)
  async createVariant(tenantId: string, productId: string, input: unknown) {
    const parsed = CreateProductVariantSchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors);
    }
    const data = parsed.data;

    return this.tenantContext.withTenant(tenantId, async (tx) => {
      const product = await tx.product.findUnique({
        where: { tenantId_id: { tenantId, id: productId } },
      });
      if (!product) {
        throw new NotFoundException(`Product ${productId} not found`);
      }

      return tx.productVariant.create({
        data: {
          tenantId,
          productId,
          name: data.name,
          attributeName: data.attributeName,
          attributeValue: data.attributeValue,
          priceAdjustment: new Prisma.Decimal(data.priceAdjustment),
        },
      });
    });
  }

  async listVariants(tenantId: string, productId: string) {
    return this.tenantContext.withTenant(tenantId, async (tx) => {
      return tx.productVariant.findMany({
        where: { tenantId, productId },
      });
    });
  }

  // GAP-04: Plan Schedule Rules & Pricing
  async createPrice(tenantId: string, input: unknown) {
    const parsed = CreatePriceSchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors);
    }
    const data = parsed.data;

    return this.tenantContext.withTenant(tenantId, async (tx) => {
      const product = await tx.product.findUnique({
        where: { tenantId_id: { tenantId, id: data.productId } },
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${data.productId} not found`);
      }

      let unitAmount = new Prisma.Decimal(data.unitAmount);
      // If variantId provided, calculate base + adjustment
      if (data.variantId) {
        const variant = await tx.productVariant.findUnique({
          where: { tenantId_id: { tenantId, id: data.variantId } },
        });
        if (variant) {
          unitAmount = product.salesPrice.plus(variant.priceAdjustment);
        }
      }

      return tx.price.create({
        data: {
          tenantId,
          productId: data.productId,
          variantId: data.variantId,
          nickname: data.nickname,
          currency: data.currency.toUpperCase(),
          unitAmount,
          billingInterval: data.billingInterval,
          billingIntervalCount: data.billingIntervalCount,
          pricingModel: data.pricingModel,
          taxRatePercentage: new Prisma.Decimal(data.taxRatePercentage),
          minQuantity: data.minQuantity,
          startDate: data.startDate ? new Date(data.startDate) : undefined,
          endDate: data.endDate ? new Date(data.endDate) : undefined,
          autoClose: data.autoClose,
          allowPause: data.allowPause,
          allowEarlyClose: data.allowEarlyClose,
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
