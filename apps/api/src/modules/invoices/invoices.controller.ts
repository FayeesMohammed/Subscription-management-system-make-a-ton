import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { TenantContext } from '@brightloop/shared-types';

@Controller('invoices')
@UseGuards(JwtAuthGuard, TenantGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  async findAll(
    @CurrentTenant() tenant: TenantContext,
    @Query('customerId') customerId?: string,
    @Query('status') status?: string,
  ) {
    return this.invoicesService.findAll(tenant.tenantId, customerId, status);
  }

  @Get(':id')
  async findOne(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
  ) {
    return this.invoicesService.findOne(tenant.tenantId, id);
  }

  @Post(':id/credit-notes')
  async createCreditNote(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body('amount') amount: string,
    @Body('reason') reason: string,
  ) {
    return this.invoicesService.createCreditNote(tenant.tenantId, id, amount, reason);
  }
}
