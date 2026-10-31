import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser, TenantContext, TenantRole } from '@brightloop/shared-types';

@Controller('tenants')
@UseGuards(JwtAuthGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  async listUserTenants(@CurrentUser() user: AuthenticatedUser) {
    return this.tenantsService.getUserTenants(user.id);
  }

  @Post()
  async createTenant(
    @CurrentUser() user: AuthenticatedUser,
    @Body('name') name: string,
  ) {
    return this.tenantsService.createTenant(user.id, name);
  }

  @Get('current')
  @UseGuards(TenantGuard)
  async getCurrentTenant(@CurrentTenant() tenantContext: TenantContext) {
    return this.tenantsService.getTenantDetails(tenantContext.tenantId);
  }

  @Get('current/members')
  @UseGuards(TenantGuard)
  async getMembers(@CurrentTenant() tenantContext: TenantContext) {
    return this.tenantsService.getMembers(tenantContext.tenantId);
  }

  // GAP-02: Admin-only staff/member creation
  @Post('current/members')
  @UseGuards(TenantGuard)
  @Roles(TenantRole.TENANT_ADMIN, TenantRole.ADMIN, TenantRole.OWNER)
  async addMember(
    @CurrentTenant() tenantContext: TenantContext,
    @Body('email') email: string,
    @Body('role') role: TenantRole,
  ) {
    return this.tenantsService.addMember(tenantContext.tenantId, email, role || TenantRole.MEMBER);
  }

  // GAP-02: Explicit staff endpoint POST /tenants/:id/staff
  @Post(':id/staff')
  @UseGuards(TenantGuard)
  @Roles(TenantRole.TENANT_ADMIN, TenantRole.ADMIN, TenantRole.OWNER)
  async addStaff(
    @CurrentTenant() tenantContext: TenantContext,
    @Body('email') email: string,
    @Body('role') role?: TenantRole,
  ) {
    return this.tenantsService.addMember(
      tenantContext.tenantId,
      email,
      role || TenantRole.TENANT_STAFF,
    );
  }
}
