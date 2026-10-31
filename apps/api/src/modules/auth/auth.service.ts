import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { RegisterSchema, LoginSchema } from '@brightloop/validation';
import { TenantRole } from '@brightloop/shared-types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private hashToken(raw: string): string {
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  async register(input: unknown) {
    const parsed = RegisterSchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors);
    }
    const { email, password, firstName, lastName, tenantName } = parsed.data;

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await argon2.hash(password);

    // Atomically create user, tenant, and set OWNER membership
    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
        },
      });

      const slug = tenantName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now();
      const tenant = await tx.tenant.create({
        data: {
          name: tenantName,
          slug,
        },
      });

      const member = await tx.tenantMember.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          role: TenantRole.OWNER,
        },
      });

      return { user, tenant, member };
    });

    const tokens = await this.generateTokens(result.user.id, result.user.email);
    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
      },
      tenant: result.tenant,
      ...tokens,
    };
  }

  async login(input: unknown) {
    const parsed = LoginSchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors);
    }
    const { email, password } = parsed.data;

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          include: { tenant: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const validPassword = await argon2.verify(user.passwordHash, password);
    if (!validPassword) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      tenants: user.memberships.map((m) => ({
        id: m.tenant.id,
        name: m.tenant.name,
        slug: m.tenant.slug,
        role: m.role,
      })),
      ...tokens,
    };
  }

  async refreshTokens(rawRefreshToken: string) {
    if (!rawRefreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const hashed = this.hashToken(rawRefreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hashed },
      include: { user: true },
    });

    if (!stored) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Reuse detection: If token was already revoked, revoke the ENTIRE token family!
    if (stored.isRevoked || stored.expiresAt < new Date()) {
      await this.prisma.refreshToken.updateMany({
        where: { familyId: stored.familyId },
        data: { isRevoked: true },
      });
      throw new UnauthorizedException('Refresh token reuse or expiry detected. All sessions in family revoked.');
    }

    // Revoke current token
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { isRevoked: true },
    });

    // Issue new token in same family
    const newRawRefreshToken = crypto.randomBytes(40).toString('hex');
    const newHashed = this.hashToken(newRawRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        userId: stored.userId,
        familyId: stored.familyId,
        tokenHash: newHashed,
        expiresAt,
      },
    });

    const accessToken = this.jwtService.sign(
      { sub: stored.userId, email: stored.user.email },
      {
        secret: process.env.JWT_ACCESS_SECRET || 'brightloop_development_super_secret_jwt_access_key_32bytes_long!!',
        expiresIn: '15m',
      },
    );

    return {
      accessToken,
      refreshToken: newRawRefreshToken,
    };
  }

  async logout(userId: string, rawRefreshToken?: string) {
    if (rawRefreshToken) {
      const hashed = this.hashToken(rawRefreshToken);
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash: hashed },
        data: { isRevoked: true },
      });
    } else {
      // Revoke all tokens for user
      await this.prisma.refreshToken.updateMany({
        where: { userId },
        data: { isRevoked: true },
      });
    }
    return { success: true };
  }

  private async generateTokens(userId: string, email: string) {
    const accessToken = this.jwtService.sign(
      { sub: userId, email },
      {
        secret: process.env.JWT_ACCESS_SECRET || 'brightloop_development_super_secret_jwt_access_key_32bytes_long!!',
        expiresIn: '15m',
      },
    );

    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);
    const familyId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        familyId,
        tokenHash,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }
}
