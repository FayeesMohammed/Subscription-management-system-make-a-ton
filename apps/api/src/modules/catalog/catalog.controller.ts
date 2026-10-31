import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { TenantContext } from '@brightloop/shared-types';

@Controller('catalog')
@UseGuards(JwtAuthGuard, TenantGuard)
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Post('products')
  async createProduct(
    @CurrentTenant() tenant: TenantContext,
    @Body() body: unknown,
  ) {
    return this.catalogService.createProduct(tenant.tenantId, body);
  }

  @Get('products')
  async findAllProducts(@CurrentTenant() tenant: TenantContext) {
    return this.catalogService.findAllProducts(tenant.tenantId);
  }

  // GAP-03: Variant endpoints
  @Post('products/:id/variants')
  async createVariant(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') productId: string,
    @Body() body: unknown,
  ) {
    return this.catalogService.createVariant(tenant.tenantId, productId, body);
  }

  @Get('products/:id/variants')
  async listVariants(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') productId: string,
  ) {
    return this.catalogService.listVariants(tenant.tenantId, productId);
  }

  @Post('prices')
  async createPrice(
    @CurrentTenant() tenant: TenantContext,
    @Body() body: unknown,
  ) {
    return this.catalogService.createPrice(tenant.tenantId, body);
  }

  @Get('prices')
  async findAllPrices(
    @CurrentTenant() tenant: TenantContext,
    @Query('productId') productId?: string,
  ) {
    return this.catalogService.findAllPrices(tenant.tenantId, productId);
  }
}
