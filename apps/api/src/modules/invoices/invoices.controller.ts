import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantContext, AuthenticatedUser } from '@brightloop/shared-types';

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

  // GAP-08: Overdue invoices query
  @Get('overdue')
  async getOverdue(@CurrentTenant() tenant: TenantContext) {
    return this.invoicesService.getOverdueInvoices(tenant.tenantId);
  }

  @Get(':id')
  async findOne(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
  ) {
    return this.invoicesService.findOne(tenant.tenantId, id);
  }

  // GAP-06: Confirm invoice
  @Post(':id/confirm')
  @HttpCode(HttpStatus.OK)
  async confirm(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
  ) {
    return this.invoicesService.confirmInvoice(tenant.tenantId, id);
  }

  // GAP-06: Void invoice
  @Post(':id/void')
  @HttpCode(HttpStatus.OK)
  async void(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    return this.invoicesService.voidInvoice(tenant.tenantId, id, reason);
  }

  // GAP-08: Record manual/offline payment (Cash, Bank, Cheque)
  @Post(':id/manual-payments')
  async recordManualPayment(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.invoicesService.recordManualPayment(tenant.tenantId, id, body, user.id);
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
