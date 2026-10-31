import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { TenantContext, SubscriptionStatus } from '@brightloop/shared-types';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard, TenantGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  async create(
    @CurrentTenant() tenant: TenantContext,
    @Body() body: unknown,
  ) {
    return this.subscriptionsService.create(tenant.tenantId, body);
  }

  @Get()
  async findAll(
    @CurrentTenant() tenant: TenantContext,
    @Query('customerId') customerId?: string,
  ) {
    return this.subscriptionsService.findAll(tenant.tenantId, customerId);
  }

  @Get(':id')
  async findOne(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
  ) {
    return this.subscriptionsService.findOne(tenant.tenantId, id);
  }

  @Patch(':id/status')
  async transitionStatus(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body('status') status: SubscriptionStatus,
    @Body('reason') reason?: string,
  ) {
    return this.subscriptionsService.transition(tenant.tenantId, id, status, reason, tenant.userId);
  }

  @Post(':id/cancel')
  async cancel(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body('immediately') immediately = false,
  ) {
    return this.subscriptionsService.cancel(tenant.tenantId, id, immediately);
  }
}
