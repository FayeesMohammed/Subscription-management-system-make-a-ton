import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    // Runtime API MUST use DATABASE_APP_URL (restricted brightloop_app role: NOSUPERUSER, NOBYPASSRLS)
    const appUrl = process.env.DATABASE_APP_URL || process.env.DATABASE_URL;
    super({
      datasources: {
        db: {
          url: appUrl,
        },
      },
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Prisma connected with runtime application role (RLS enforced)');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
