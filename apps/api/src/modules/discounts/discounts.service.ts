import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { TenantContextService } from '../../database/tenant-context.service';
import { CreateDiscountSchema } from '@brightloop/validation';
import { Prisma } from '@prisma/client';
import { Decimal } from '@brightloop/financial-core';
import { DiscountType } from '@brightloop/shared-types';

@Injectable()
export class DiscountsService {
  constructor(private readonly tenantContext: TenantContextService) {}

  async createDiscount(tenantId: string, input: unknown) {
    const parsed = CreateDiscountSchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors);
    }
    const data = parsed.data;

    return this.tenantContext.withTenant(tenantId, async (tx) => {
      const existing = await tx.discount.findUnique({
        where: { tenantId_code: { tenantId, code: data.code } },
      });
      if (existing) {
        throw new BadRequestException(`Discount code '${data.code}' already exists`);
      }

      return tx.discount.create({
        data: {
          tenantId,
          code: data.code,
          name: data.name,
          type: data.type as any,
          value: new Prisma.Decimal(data.value),
          minPurchaseAmount: new Prisma.Decimal(data.minPurchaseAmount),
          minQuantity: data.minQuantity,
          validFrom: data.validFrom ? new Date(data.validFrom) : undefined,
          validTo: data.validTo ? new Date(data.validTo) : undefined,
          maxUsageLimit: data.maxUsageLimit,
          productId: data.productId,
        },
      });
    });
  }

  async listDiscounts(tenantId: string) {
    return this.tenantContext.withTenant(tenantId, async (tx) => {
      return tx.discount.findMany({
        orderBy: { createdAt: 'desc' },
      });
    });
  }

  /**
   * Evaluates discount applicability against subtotal and quantity.
   */
  async evaluateDiscount(
    tx: Prisma.TransactionClient,
    tenantId: string,
    code: string,
    subtotal: Decimal,
    quantity: number,
    productId?: string,
  ): Promise<{ valid: boolean; discountAmount: Decimal; reason?: string; discountId?: string }> {
    const discount = await tx.discount.findUnique({
      where: { tenantId_code: { tenantId, code: code.toUpperCase() } },
    });

    if (!discount) {
      return { valid: false, discountAmount: new Decimal(0), reason: `Discount code '${code}' not found` };
    }

    const now = new Date();
    if (discount.validFrom && discount.validFrom > now) {
      return { valid: false, discountAmount: new Decimal(0), reason: 'Discount is not active yet' };
    }
    if (discount.validTo && discount.validTo < now) {
      return { valid: false, discountAmount: new Decimal(0), reason: 'Discount has expired' };
    }
    if (discount.maxUsageLimit && discount.currentUsageCount >= discount.maxUsageLimit) {
      return { valid: false, discountAmount: new Decimal(0), reason: 'Discount usage limit reached' };
    }
    if (discount.productId && productId && discount.productId !== productId) {
      return { valid: false, discountAmount: new Decimal(0), reason: 'Discount not applicable to this product' };
    }

    const minAmount = new Decimal(discount.minPurchaseAmount.toString());
    if (subtotal.lessThan(minAmount)) {
      return {
        valid: false,
        discountAmount: new Decimal(0),
        reason: `Minimum purchase amount of ${minAmount} not met`,
      };
    }

    if (quantity < discount.minQuantity) {
      return {
        valid: false,
        discountAmount: new Decimal(0),
        reason: `Minimum quantity of ${discount.minQuantity} not met`,
      };
    }

    let discountAmount = new Decimal(0);
    if (discount.type === DiscountType.FIXED_AMOUNT) {
      const fixed = new Decimal(discount.value.toString());
      discountAmount = fixed.greaterThan(subtotal) ? subtotal : fixed;
    } else if (discount.type === DiscountType.PERCENTAGE) {
      const pct = new Decimal(discount.value.toString()).dividedBy(100);
      discountAmount = subtotal.times(pct).toDecimalPlaces(2);
    }

    return {
      valid: true,
      discountAmount,
      discountId: discount.id,
    };
  }
}
