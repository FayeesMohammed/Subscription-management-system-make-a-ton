import { Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Prisma } from '@prisma/client';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class TenantContextService {
  private readonly logger = new Logger(TenantContextService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Executes a callback within a transaction-local tenant context.
   * Parameter `true` in set_config scopes the variable strictly to the current transaction.
   * This guarantees that when the transaction completes or rolls back, the context is cleared,
   * completely preventing connection-pool context leakage.
   */
  async withTenant<T>(
    tenantId: string,
    callback: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    if (!tenantId || !UUID_REGEX.test(tenantId)) {
      throw new BadRequestException(`Invalid tenant ID format: ${tenantId}`);
    }

    return this.prisma.$transaction(
      async (tx) => {
        // Parameterized query setting local transaction variable
        await tx.$queryRaw`
          SELECT set_config('app.current_tenant', ${tenantId}, true)
        `;

        try {
          return await callback(tx);
        } catch (error) {
          this.logger.debug(`Tenant transaction error for tenant ${tenantId}: ${(error as Error).message}`);
          throw error;
        }
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        maxWait: 5000,
        timeout: 10000,
      },
    );
  }
}
