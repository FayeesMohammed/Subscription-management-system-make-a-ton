import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../database/prisma.service';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { TenantRole, TenantContext } from '@brightloop/shared-types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ROLE_HIERARCHY: Record<TenantRole, number> = {
  [TenantRole.VIEWER]: 1,
  [TenantRole.MEMBER]: 2,
  [TenantRole.FINANCE]: 3,
  [TenantRole.ADMIN]: 4,
  [TenantRole.OWNER]: 5,
};

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new ForbiddenException('User authentication required before tenant resolution');
    }

    const tenantHeader = request.headers['x-tenant-id'] as string;
    if (!tenantHeader || !UUID_REGEX.test(tenantHeader)) {
      throw new BadRequestException('A valid x-tenant-id header is required');
    }

    // Verify verified tenant membership in database
    const membership = await this.prisma.tenantMember.findUnique({
      where: {
        tenantId_userId: {
          tenantId: tenantHeader,
          userId: user.id,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('Access denied: You are not a verified member of this organization');
    }

    // Check role requirements if specified
    const requiredRoles = this.reflector.getAllAndOverride<TenantRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredRoles && requiredRoles.length > 0) {
      const userLevel = ROLE_HIERARCHY[membership.role as TenantRole] || 0;
      const isAuthorized = requiredRoles.some((role) => userLevel >= ROLE_HIERARCHY[role]);
      if (!isAuthorized) {
        throw new ForbiddenException(`Insufficient permissions. Required roles: ${requiredRoles.join(', ')}`);
      }
    }

    const tenantContext: TenantContext = {
      tenantId: membership.tenantId,
      userId: user.id,
      role: membership.role as TenantRole,
    };

    request.tenantContext = tenantContext;
    return true;
  }
}
