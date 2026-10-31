import {
  Controller,
  Get,
  Post,
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
