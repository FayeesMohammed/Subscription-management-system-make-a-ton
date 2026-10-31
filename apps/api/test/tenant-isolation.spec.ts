import { PrismaClient } from '@prisma/client';
import { TenantContextService } from '../src/database/tenant-context.service';
import { PrismaService } from '../src/database/prisma.service';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

describe('Phase 1: Tenant Isolation & RLS Security Suite', () => {
  let prisma: PrismaService;
  let tenantContextService: TenantContextService;

  let tenantAId: string;
  let tenantBId: string;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();
    tenantContextService = new TenantContextService(prisma);

    // Create two test tenants (global table, accessible by app role)
    const tenantA = await prisma.tenant.create({
      data: {
        name: 'Tenant Alpha Corp',
        slug: `alpha-${Date.now()}`,
      },
    });
    tenantAId = tenantA.id;

    const tenantB = await prisma.tenant.create({
      data: {
        name: 'Tenant Beta Ltd',
        slug: `beta-${Date.now()}`,
      },
    });
    tenantBId = tenantB.id;
  });

  afterAll(async () => {
    // Cleanup using privileged database connection or direct cascade
    const superClient = new PrismaClient({
      datasources: { db: { url: process.env.DATABASE_URL } },
    });
    await superClient.tenant.deleteMany({
      where: { id: {入: [tenantAId, tenantBId] } as any },
    }).catch(() => {});
    await superClient.$disconnect();
    await prisma.$disconnect();
  });

  test('Invariant 13: Runtime connection role must not be superuser and must not have BYPASSRLS', async () => {
    const roles: any[] = await prisma.$queryRaw`
      SELECT rolname, rolsuper, rolbypassrls
      FROM pg_roles
      WHERE rolname = current_user
    `;
    expect(roles.length).toBe(1);
    expect(roles[0].rolname).toBe('brightloop_app');
    expect(roles[0].rolsuper).toBe(false);
    expect(roles[0].rolbypassrls).toBe(false);
  });

  test('RLS Coverage: All tenant-owned tables must have RLS and FORCE RLS enabled', async () => {
    const tenantTables = [
      'customers',
      'products',
      'prices',
      'subscriptions',
      'subscription_items',
      'subscription_status_logs',
      'invoice_sequences',
      'invoices',
      'invoice_lines',
      'credit_notes',
      'payment_attempts',
      'payments',
      'idempotency_keys',
      'meters',
      'usage_events',
      'audit_logs',
    ];

    const results: any[] = await prisma.$queryRaw`
      SELECT relname as tablename, relrowsecurity, relforcerowsecurity
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND relname = ANY(${tenantTables})
    `;

    expect(results.length).toBe(tenantTables.length);
    for (const row of results) {
      expect(row.relrowsecurity).toBe(true);
      expect(row.relforcerowsecurity).toBe(true);
    }
  });

  test('Missing tenant context exposes ZERO tenant rows', async () => {
    // Querying customers directly without tenant context
    const customers = await prisma.customer.findMany();
    expect(customers.length).toBe(0);

    const subscriptions = await prisma.subscription.findMany();
    expect(subscriptions.length).toBe(0);

    const invoices = await prisma.invoice.findMany();
    expect(invoices.length).toBe(0);
  });

  test('Tenant Isolation: Tenant A cannot read, update, or delete Tenant B rows', async () => {
    // 1. In Tenant A context: insert customer A
    const customerA = await tenantContextService.withTenant(tenantAId, async (tx) => {
      return tx.customer.create({
        data: {
          tenantId: tenantAId,
          name: 'Customer A',
          email: 'custA@example.com',
          country: 'IN',
        },
      });
    });

    // 2. In Tenant B context: verify customer A cannot be read
    await tenantContextService.withTenant(tenantBId, async (tx) => {
      const found = await tx.customer.findUnique({
        where: { id: customerA.id },
      });
      expect(found).toBeNull();

      const all = await tx.customer.findMany();
      expect(all.some((c) => c.id === customerA.id)).toBe(false);
    });

    // 3. In Tenant B context: verify customer A cannot be updated
    await tenantContextService.withTenant(tenantBId, async (tx) => {
      const updateResult = await tx.customer.updateMany({
        where: { id: customerA.id },
        data: { name: 'Hacked Name' },
      });
      expect(updateResult.count).toBe(0);
    });

    // 4. In Tenant B context: verify customer A cannot be deleted
    await tenantContextService.withTenant(tenantBId, async (tx) => {
      const deleteResult = await tx.customer.deleteMany({
        where: { id: customerA.id },
      });
      expect(deleteResult.count).toBe(0);
    });

    // Verify customer A is still intact in Tenant A context
    await tenantContextService.withTenant(tenantAId, async (tx) => {
      const intact = await tx.customer.findUnique({
        where: { id: customerA.id },
      });
      expect(intact).not.toBeNull();
      expect(intact?.name).toBe('Customer A');
    });
  });

  test('Composite Tenant Foreign Keys: Tenant B cannot create subscription referencing Tenant A customer', async () => {
    // Get Customer A id
    const customerA = await tenantContextService.withTenant(tenantAId, async (tx) => {
      return tx.customer.findFirstOrThrow({ where: { email: 'custA@example.com' } });
    });

    // Attempting to insert a subscription in Tenant B referencing Customer A
    await expect(
      tenantContextService.withTenant(tenantBId, async (tx) => {
        return tx.subscription.create({
          data: {
            tenantId: tenantBId,
            customerId: customerA.id, // Belongs to Tenant A!
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
      }),
    ).rejects.toThrow();
  });

  test('Connection pool safety: Context does not leak to subsequent queries', async () => {
    // Query with Tenant A
    await tenantContextService.withTenant(tenantAId, async (tx) => {
      const c = await tx.customer.findMany();
      expect(c.length).toBeGreaterThan(0);
    });

    // Immediate subsequent raw query outside tenant context must have null context and see 0 rows
    const count = await prisma.customer.count();
    expect(count).toBe(0);

    const setting: any[] = await prisma.$queryRaw`
      SELECT current_setting('app.current_tenant', true) as tenant
    `;
    expect(setting[0].tenant).toBeFalsy();
  });

  test('Invoice Immutability: Finalized invoices cannot be altered or deleted', async () => {
    // Create customer and draft invoice in Tenant A
    const { customer, invoice } = await tenantContextService.withTenant(tenantAId, async (tx) => {
      const c = await tx.customer.findFirstOrThrow({ where: { email: 'custA@example.com' } });
      const inv = await tx.invoice.create({
        data: {
          tenantId: tenantAId,
          customerId: c.id,
          invoiceNumber: `INV-2026-${Date.now()}`,
          status: 'draft',
          subtotal: 1000,
          taxTotal: 180,
          total: 1180,
          amountDue: 1180,
          dueDate: new Date(),
          periodStart: new Date(),
          periodEnd: new Date(),
        },
      });
      return { customer: c, invoice: inv };
    });

    // Finalize invoice
    await tenantContextService.withTenant(tenantAId, async (tx) => {
      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          status: 'finalized',
          finalizedAt: new Date(),
        },
      });
    });

    // Attempt to alter invoice monetary amount
    await expect(
      tenantContextService.withTenant(tenantAId, async (tx) => {
        return tx.invoice.update({
          where: { id: invoice.id },
          data: {
            total: 500, // Attempt mutation!
          },
        });
      }),
    ).rejects.toThrow(/Cannot mutate monetary values/i);

    // Attempt to delete finalized invoice
    await expect(
      tenantContextService.withTenant(tenantAId, async (tx) => {
        return tx.invoice.delete({
          where: { id: invoice.id },
        });
      }),
    ).rejects.toThrow(/Cannot delete finalized/i);
  });
});
