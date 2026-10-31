import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { ReportingService } from '../src/modules/reporting/reporting.service';
import { SubscriptionStatus, InvoiceStatus, PaymentMethod, DiscountType } from '@brightloop/shared-types';

describe('Extension Features & Gaps Verification (GAP-01 to GAP-09)', () => {
  let app: INestApplication;
  let reportingService: ReportingService;

  let ownerToken: string;
  let tenantId: string;
  let staffToken: string;
  let staffEmail: string;
  let customerId: string;
  let productId: string;
  let variantId: string;
  let restrictedPriceId: string;
  let quoteSubscriptionId: string;
  let invoiceId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication({ rawBody: true });
    app.setGlobalPrefix('api');
    await app.init();

    reportingService = app.get(ReportingService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GAP-01: Password Complexity Enforcement & Password Reset Flow', () => {
    test('Rejects registration with weak password (missing uppercase/special/numbers)', async () => {
      // Missing uppercase and special char
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: `weak.${Date.now()}@example.com`,
          password: 'password123',
          firstName: 'Weak',
          lastName: 'User',
          tenantName: 'Weak Co',
        })
        .expect(400);

      // Too short
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: `short.${Date.now()}@example.com`,
          password: 'P1!',
          firstName: 'Short',
          lastName: 'User',
          tenantName: 'Short Co',
        })
        .expect(400);
    });

    test('Accepts valid complex password and completes full password reset flow', async () => {
      const email = `reset.user.${Date.now()}@example.com`;
      const initialPassword = 'InitialSecure123!';
      const newPassword = 'NewSecretPassword456!';

      // 1. Register user
      const reg = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email,
          password: initialPassword,
          firstName: 'Reset',
          lastName: 'Tester',
          tenantName: 'Reset Corp',
        })
        .expect(201);

      ownerToken = reg.body.accessToken;
      tenantId = reg.body.tenant.id;

      // 2. Request password reset
      const resetReq = await request(app.getHttpServer())
        .post('/api/auth/password-reset-request')
        .send({ email })
        .expect(200);

      expect(resetReq.body.message).toContain('Reset token generated');
      const resetToken = resetReq.body.resetToken;
      expect(resetToken).toBeDefined();

      // 3. Confirm password reset with the token
      await request(app.getHttpServer())
        .post('/api/auth/password-reset-confirm')
        .send({
          token: resetToken,
          newPassword,
        })
        .expect(200);

      // 4. Verify old password fails
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email,
          password: initialPassword,
        })
        .expect(401);

      // 5. Verify new password succeeds
      const newLogin = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email,
          password: newPassword,
        })
        .expect(200);

      expect(newLogin.body.accessToken).toBeDefined();
      ownerToken = newLogin.body.accessToken;
    });
  });

  describe('GAP-02: Tenant Staff Governance & Role Guards', () => {
    test('Invites a staff member and restricts staff from administrative tenant management', async () => {
      staffEmail = `staff.${Date.now()}@example.com`;
      const staffReg = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: staffEmail,
          password: 'StaffPassword123!',
          firstName: 'Staff',
          lastName: 'Officer',
          tenantName: 'Officer Workspace',
        })
        .expect(201);

      staffToken = staffReg.body.accessToken;

      // Admin invites staff into tenant
      const inviteRes = await request(app.getHttpServer())
        .post(`/api/tenants/${tenantId}/staff`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('x-tenant-id', tenantId)
        .send({
          email: staffEmail,
          role: 'TENANT_STAFF',
        })
        .expect(201);

      expect(inviteRes.body.role).toBe('TENANT_STAFF');

      // Staff user attempts to assign admin role to another user (should be forbidden: requires ADMIN/OWNER)
      await request(app.getHttpServer())
        .post(`/api/tenants/${tenantId}/staff`)
        .set('Authorization', `Bearer ${staffToken}`)
        .set('x-tenant-id', tenantId)
        .send({
          email: staffEmail,
          role: 'ADMIN',
        })
        .expect(403);
    });
  });

  describe('GAP-03: Product Cost Tracking & Variant Pricing Modifiers', () => {
    test('Creates product with sales and cost price, and creates variant (+560)', async () => {
      // 1. Create base product with salesPrice and costPrice
      const prodRes = await request(app.getHttpServer())
        .post('/api/catalog/products')
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('x-tenant-id', tenantId)
        .send({
          name: 'Enterprise Cloud Suite',
          type: 'SOFTWARE',
          salesPrice: '2000.00',
          costPrice: '800.00',
          description: 'Full stack enterprise cloud subscription',
        })
        .expect(201);

      productId = prodRes.body.id;
      expect(Number(prodRes.body.salesPrice)).toBe(2000);
      expect(Number(prodRes.body.costPrice)).toBe(800);

      // 2. Create variant with price adjustment (+560)
      const varRes = await request(app.getHttpServer())
        .post(`/api/catalog/products/${productId}/variants`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('x-tenant-id', tenantId)
        .send({
          name: 'High Memory & Dedicated CPU',
          attributeName: 'Configuration',
          attributeValue: 'High Memory',
          priceAdjustment: '560.00',
        })
        .expect(201);

      variantId = varRes.body.id;
      expect(Number(varRes.body.priceAdjustment)).toBe(560);
    });
  });

  describe('GAP-04: Plan Schedule Intervals & Availability Constraints', () => {
    test('Configures plan with minQuantity and validates order quantity constraint', async () => {
      // Create price with minQuantity = 5 and taxRate = 0% for exact round arithmetic
      const priceRes = await request(app.getHttpServer())
        .post('/api/catalog/prices')
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('x-tenant-id', tenantId)
        .send({
          productId,
          currency: 'INR',
          billingInterval: 'month',
          unitAmount: '2000.00',
          minQuantity: 5,
          taxRatePercentage: '0',
        })
        .expect(201);

      restrictedPriceId = priceRes.body.id;
      expect(priceRes.body.minQuantity).toBe(5);

      // Create a customer first
      const custRes = await request(app.getHttpServer())
        .post('/api/customers')
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('x-tenant-id', tenantId)
        .send({
          name: 'Schedule Compliance Customer',
          email: `compliance.${Date.now()}@example.com`,
          currency: 'INR',
        })
        .expect(201);

      customerId = custRes.body.id;

      // Attempt subscription with quantity = 2 (less than minQuantity 5) -> must fail with 400
      const failRes = await request(app.getHttpServer())
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('x-tenant-id', tenantId)
        .send({
          customerId,
          priceId: restrictedPriceId,
          quantity: 2,
        })
        .expect(400);

      expect(JSON.stringify(failRes.body)).toContain('Minimum quantity for this plan is 5');
    });
  });

  describe('GAP-05: Quotation Pipeline (Draft -> Quotation -> Confirmed -> Active -> Closed)', () => {
    test('Executes quotation workflow lifecycle', async () => {
      // 1. Create a quotation
      const quoteRes = await request(app.getHttpServer())
        .post('/api/subscriptions/quotes')
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('x-tenant-id', tenantId)
        .send({
          customerId,
          priceId: restrictedPriceId,
          quantity: 10,
          validForDays: 30,
        })
        .expect(201);

      quoteSubscriptionId = quoteRes.body.id;
      expect(quoteRes.body.status).toBe(SubscriptionStatus.QUOTATION);

      // 2. Confirm the quote
      const confirmRes = await request(app.getHttpServer())
        .post(`/api/subscriptions/${quoteSubscriptionId}/confirm-quote`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('x-tenant-id', tenantId)
        .expect(200);

      expect(confirmRes.body.status).toBe(SubscriptionStatus.CONFIRMED);

      // 3. Activate the quote into an active subscription
      const activateRes = await request(app.getHttpServer())
        .post(`/api/subscriptions/${quoteSubscriptionId}/activate`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('x-tenant-id', tenantId)
        .expect(200);

      expect(activateRes.body.subscription.status).toBe(SubscriptionStatus.ACTIVE);

      // 4. Close the subscription
      const closeRes = await request(app.getHttpServer())
        .post(`/api/subscriptions/${quoteSubscriptionId}/close`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('x-tenant-id', tenantId)
        .send({ reason: 'Client requested migration' })
        .expect(200);

      expect(closeRes.body.status).toBe(SubscriptionStatus.CLOSED);
    });
  });

  describe('GAP-07: Discount Rule Engine & Application', () => {
    test('Creates discount rules and verifies deduction on subscription creation', async () => {
      // 1. Create a 15% discount rule
      const discountCode = `SAVE15_${Date.now()}`;
      const discRes = await request(app.getHttpServer())
        .post('/api/discounts')
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('x-tenant-id', tenantId)
        .send({
          code: discountCode,
          name: 'Special 15% Launch Offer',
          type: DiscountType.PERCENTAGE,
          value: '15.00',
          maxUsageLimit: 100,
        })
        .expect(201);

      expect(discRes.body.code).toBe(discountCode);

      // 2. Create subscription with the discount code applied
      const subRes = await request(app.getHttpServer())
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('x-tenant-id', tenantId)
        .send({
          customerId,
          priceId: restrictedPriceId,
          quantity: 5, // unitAmount 2000 * 5 = 10,000 subtotal
          discountCode,
        })
        .expect(201);

      expect(subRes.body.subscription.status).toBe(SubscriptionStatus.ACTIVE);
      invoiceId = subRes.body.invoice.id;
      expect(invoiceId).toBeDefined();

      // 10,000 subtotal - 15% discount (1500) = 8500 total amount
      expect(Number(subRes.body.invoice.subtotal)).toBe(10000);
      expect(Number(subRes.body.invoice.discountTotal)).toBe(1500);
      expect(Number(subRes.body.invoice.total)).toBe(8500);
    });
  });

  describe('GAP-06 & GAP-08: Invoice Lifecycle, Manual Payments & Overdue Tracking', () => {
    test('Confirms invoice, records manual payments, and marks as paid upon full settlement', async () => {
      // 1. Confirm invoice
      const confirmRes = await request(app.getHttpServer())
        .post(`/api/invoices/${invoiceId}/confirm`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('x-tenant-id', tenantId)
        .expect(200);

      expect([InvoiceStatus.CONFIRMED, InvoiceStatus.FINALIZED]).toContain(confirmRes.body.status);

      // 2. Record partial manual offline payment (cash Rs. 5000 of 8500)
      const partPayRes = await request(app.getHttpServer())
        .post(`/api/invoices/${invoiceId}/manual-payments`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('x-tenant-id', tenantId)
        .send({
          amount: '5000.00',
          paymentMethod: PaymentMethod.CASH,
          referenceNote: `CASH-REC-${Date.now()}: Counter cash payment`,
        })
        .expect(201);

      expect(partPayRes.body.payment.paymentMethod).toBe(PaymentMethod.CASH);
      expect(Number(partPayRes.body.invoice.amountDue)).toBe(3500);

      // 3. Record remaining manual payment (bank transfer Rs. 3500)
      const fullPayRes = await request(app.getHttpServer())
        .post(`/api/invoices/${invoiceId}/manual-payments`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('x-tenant-id', tenantId)
        .send({
          amount: '3500.00',
          paymentMethod: PaymentMethod.BANK_TRANSFER,
          referenceNote: `NEFT-TRANS-${Date.now()}: Bank wire settlement`,
        })
        .expect(201);

      // Now invoice should be automatically transitioned to PAID
      expect(fullPayRes.body.invoice.status).toBe(InvoiceStatus.PAID);
      expect(Number(fullPayRes.body.invoice.amountDue)).toBe(0);

      // 4. Query overdue invoices endpoint
      const overdueRes = await request(app.getHttpServer())
        .get('/api/invoices/overdue')
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('x-tenant-id', tenantId)
        .expect(200);

      expect(Array.isArray(overdueRes.body)).toBe(true);
    });
  });

  describe('GAP-09: Financial Reporting Sub-2-Second SLA Verification', () => {
    test('Generates dashboard metrics under 2000ms SLA and includes manual vs gateway breakdown', async () => {
      const startTime = performance.now();

      const dashboard = await reportingService.getMetrics(tenantId);

      const durationMs = performance.now() - startTime;

      expect(durationMs).toBeLessThan(2000); // Sub-2-second requirement
      expect(dashboard).toBeDefined();
      expect(dashboard.slaStatus).toBe('PASSED_SUB_2_SECOND');
      expect(dashboard.activeSubscriptions).toBeGreaterThanOrEqual(1);
      expect(dashboard.paymentBreakdown).toBeDefined();
      expect(Number(dashboard.paymentBreakdown.manualOffline)).toBeGreaterThanOrEqual(8500);
    });
  });
});
