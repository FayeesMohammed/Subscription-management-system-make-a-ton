import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsageService } from './usage.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { TenantContext } from '@brightloop/shared-types';

@Controller('usage')
@UseGuards(JwtAuthGuard, TenantGuard)
export class UsageController {
  constructor(private readonly usageService: UsageService) {}

  @Post('meters')
  async createMeter(
    @CurrentTenant() tenant: TenantContext,
    @Body() body: { code: string; name: string; unit: string; aggregationType?: string },
  ) {
    return this.usageService.createMeter(tenant.tenantId, body);
  }

  @Get('meters')
  async listMeters(@CurrentTenant() tenant: TenantContext) {
    return this.usageService.listMeters(tenant.tenantId);
  }

  @Post('events')
  async recordEvent(
    @CurrentTenant() tenant: TenantContext,
    @Body() body: unknown,
  ) {
    return this.usageService.recordUsageEvent(tenant.tenantId, body);
  }

  @Get('aggregate')
  async aggregate(
    @CurrentTenant() tenant: TenantContext,
    @Query('meterCode') meterCode: string,
    @Query('customerId') customerId: string,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    return this.usageService.aggregateUsage(
      tenant.tenantId,
      meterCode,
      customerId,
      new Date(start),
      new Date(end),
    );
  }
}
