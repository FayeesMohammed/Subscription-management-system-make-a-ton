import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { DiscountsService } from './discounts.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { TenantContext, TenantRole } from '@brightloop/shared-types';

@Controller('discounts')
@UseGuards(JwtAuthGuard, TenantGuard)
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  @Post()
  @Roles(TenantRole.TENANT_ADMIN, TenantRole.ADMIN, TenantRole.OWNER)
  async create(
    @CurrentTenant() tenant: TenantContext,
    @Body() body: unknown,
  ) {
    return this.discountsService.createDiscount(tenant.tenantId, body);
  }

  @Get()
  async list(@CurrentTenant() tenant: TenantContext) {
    return this.discountsService.listDiscounts(tenant.tenantId);
  }
}
