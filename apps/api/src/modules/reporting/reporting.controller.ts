import { Controller, Get, UseGuards } from '@nestjs/common';
import { ReportingService } from './reporting.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { TenantContext } from '@brightloop/shared-types';

@Controller('reporting')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  @Get('dashboard')
  async getDashboardMetrics(@CurrentTenant() tenant: TenantContext) {
    return this.reportingService.getMetrics(tenant.tenantId);
  }
}
