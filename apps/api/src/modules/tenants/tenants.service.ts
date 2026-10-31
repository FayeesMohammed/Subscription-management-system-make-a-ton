import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TenantRole } from '@brightloop/shared-types';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserTenants(userId: string) {
    const memberships = await this.prisma.tenantMember.findMany({
      where: { userId },
      include: {
        tenant: true,
      },
    });

    return memberships.map((m) => ({
      tenantId: m.tenant.id,
      name: m.tenant.name,
      slug: m.tenant.slug,
      role: m.role,
      joinedAt: m.createdAt,
    }));
  }

  async createTenant(userId: string, name: string) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now();
    return this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: { name, slug },
      });

      const member = await tx.tenantMember.create({
        data: {
          tenantId: tenant.id,
          userId,
          role: TenantRole.OWNER,
        },
      });

      return {
        tenantId: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        role: member.role,
      };
    });
  }

  async getTenantDetails(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Organization not found');
    }

    return tenant;
  }

  async getMembers(tenantId: string) {
    const members = await this.prisma.tenantMember.findMany({
      where: { tenantId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return members.map((m) => ({
      memberId: m.id,
      userId: m.user.id,
      email: m.user.email,
      name: `${m.user.firstName} ${m.user.lastName}`,
      role: m.role,
      joinedAt: m.createdAt,
    }));
  }

  async addMember(tenantId: string, email: string, role: TenantRole) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User with this email not registered in system');
    }

    const existing = await this.prisma.tenantMember.findUnique({
      where: {
        tenantId_userId: {
          tenantId,
          userId: user.id,
        },
      },
    });

    if (existing) {
      throw new ConflictException('User is already a member of this organization');
    }

    return this.prisma.tenantMember.create({
      data: {
        tenantId,
        userId: user.id,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }
}
