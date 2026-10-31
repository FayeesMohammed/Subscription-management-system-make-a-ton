import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { EnvSchema } from '@brightloop/validation';
import { PrismaService } from './database/prisma.service';

async function bootstrap() {
  const logger = new Logger('BrightloopAPI');

  // Fast-fail configuration validation at startup
  const envResult = EnvSchema.safeParse(process.env);
  if (!envResult.success) {
    logger.error('Startup halted: Invalid environment variables:');
    logger.error(JSON.stringify(envResult.error.format(), null, 2));
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Enables raw body parsing for payment webhook signatures
  });

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.setGlobalPrefix('api');

  // Liveness and Readiness Probes
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/api/health/liveness', (req: any, res: any) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  httpAdapter.get('/api/health/readiness', async (req: any, res: any) => {
    try {
      const prisma = app.get(PrismaService);
      await prisma.$queryRaw`SELECT 1`;
      res.status(200).json({
        status: 'ready',
        database: 'connected',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      res.status(503).json({
        status: 'not_ready',
        database: 'unreachable',
        error: (err as Error).message,
      });
    }
  });

  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`Brightloop API engine listening on port ${port} [NODE_ENV=${process.env.NODE_ENV}]`);
}

bootstrap();
