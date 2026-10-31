import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { TenantContext } from '@brightloop/shared-types';

@Controller('customers')
@UseGuards(JwtAuthGuard, TenantGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  async create(
    @CurrentTenant() tenant: TenantContext,
    @Body() body: unknown,
  ) {
    return this.customersService.create(tenant.tenantId, body);
  }

  @Get()
  async findAll(@CurrentTenant() tenant: TenantContext) {
    return this.customersService.findAll(tenant.tenantId);
  }

  @Get(':id')
  async findOne(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
  ) {
    return this.customersService.findOne(tenant.tenantId, id);
  }
}
