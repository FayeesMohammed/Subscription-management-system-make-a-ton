import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { RazorpayAdapter } from '../src/modules/payments/razorpay.adapter';
import * as crypto from 'crypto';

describe('MVP End-to-End Lifecycle & Delivery Verification (Section 17)', () => {
  let app: INestApplication;
  let razorpayAdapter: RazorpayAdapter;

  let ownerToken: string;
  let tenantId: string;
  let memberToken: string;
  let customerId: string;
  let productId: string;
  let priceId: string;
  let subscriptionId: string;
  let invoiceId: string;
  let gatewayOrderId: string;

  let tenantBToken: string;
  let tenantBId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication({ rawBody: true });
    app.setGlobalPrefix('api');
    await app.init();

    razorpayAdapter = app.get(RazorpayAdapter);
  });

  afterAll(async () => {
    await app.close();
  });

  test('Step 1: Register and create an organization (Tenant A)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: `alice.${Date.now()}@example.com`,
        password: 'Password123!',
        firstName: 'Alice',
        lastName: 'Founder',
        tenantName: 'Acme SaaS',
      })
      .expect(201);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.tenant.id).toBeDefined();

    ownerToken = res.body.accessToken;
    tenantId = res.body.tenant.id;
  });

  test('Step 1b: Register an independent Tenant B to verify cross-tenant boundaries', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: `bob.${Date.now()}@example.com`,
        password: 'Password123!',
        firstName: 'Bob',
        lastName: 'Rival',
        tenantName: 'Beta SaaS',
      })
      .expect(201);

    tenantBToken = res.body.accessToken;
    tenantBId = res.body.tenant.id;
  });

  test('Step 2: Invite a user and assign tenant role', async () => {
    // Register Charlie
    const charlieEmail = `charlie.${Date.now()}@example.com`;
    const charlieReg = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: charlieEmail,
        password: 'Password123!',
        firstName: 'Charlie',
        lastName: 'Finance',
        tenantName: 'Charlie Freelance',
      })
      .expect(201);

    memberToken = charlieReg.body.accessToken;

    // Alice invites Charlie into Acme SaaS as FINANCE
    const inviteRes = await request(app.getHttpServer())
      .post('/api/tenants/current/members')
      .set('Authorization', `Bearer ${ownerToken}`)
      .set('x-tenant-id', tenantId)
      .send({
        email: charlieEmail,
        role: 'FINANCE',
      })
      .expect(201);

    expect(inviteRes.body.role).toBe('FINANCE');

    // Charlie can now access Acme SaaS using x-tenant-id
    const charlieTenantCheck = await request(app.getHttpServer())
      .get('/api/tenants/current')
      .set('Authorization', `Bearer ${memberToken}`)
      .set('x-tenant-id', tenantId)
      .expect(200);

    expect(charlieTenantCheck.body.id).toBe(tenantId);
  });

  test('Step 3: Create a customer in Acme SaaS', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/customers')
      .set('Authorization', `Bearer ${ownerToken}`)
      .set('x-tenant-id', tenantId)
      .send({
        name: 'Enterprise Client Corp',
        email: 'billing@enterprise.com',
        taxNumber: '29ABCDE1234F1Z5',
        currency: 'INR',
        country: 'IN',
      })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.tenantId).toBe(tenantId);
    customerId = res.body.id;
  });

  test('Step 4: Create a product and versioned recurring price', async () => {
    const prodRes = await request(app.getHttpServer())
      .post('/api/catalog/products')
      .set('Authorization', `Bearer ${ownerToken}`)
      .set('x-tenant-id', tenantId)
      .send({
        name: 'Cloud Pro Plan',
        description: 'Professional tier cloud services',
      })
      .expect(201);

    productId = prodRes.body.id;

    // Price: 1000.00 INR/month + 18% GST
    const priceRes = await request(app.getHttpServer())
      .post('/api/catalog/prices')
      .set('Authorization', `Bearer ${ownerToken}`)
      .set('x-tenant-id', tenantId)
      .send({
        productId,
        nickname: 'Monthly Pro',
        currency: 'INR',
        unitAmount: '1000.00',
        billingInterval: 'month',
        billingIntervalCount: 1,
        pricingModel: 'fixed_recurring',
        taxRatePercentage: '18.00',
      })
      .expect(201);

    expect(priceRes.body.id).toBeDefined();
    priceId = priceRes.body.id;
  });

  test('Step 5 & 6 & 7: Create subscription, generate invoice, finalized immutably', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/subscriptions')
      .set('Authorization', `Bearer ${ownerToken}`)
      .set('x-tenant-id', tenantId)
      .send({
        customerId,
        priceId,
        quantity: 1,
        trialPeriodDays: 0,
      })
      .expect(201);

    expect(res.body.subscription.status).toBe('active');
    expect(res.body.invoice).toBeDefined();
    expect(res.body.invoice.status).toBe('finalized');

    subscriptionId = res.body.subscription.id;
    invoiceId = res.body.invoice.id;

    // Financial arithmetic check: 1000.00 net + 18% tax (180.00) = 1180.00 total
    expect(Number(res.body.invoice.subtotal)).toBe(1000);
    expect(Number(res.body.invoice.taxTotal)).toBe(180);
    expect(Number(res.body.invoice.total)).toBe(1180);
    expect(Number(res.body.invoice.amountDue)).toBe(1180);
  });

  test('Step 8: Initiate payment order through gateway adapter', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/payments/attempts')
      .set('Authorization', `Bearer ${ownerToken}`)
      .set('x-tenant-id', tenantId)
      .send({
        invoiceId,
      })
      .expect(201);

    expect(res.body.gatewayOrderId).toBeDefined();
    expect(res.body.amount).toBe('1180');
    gatewayOrderId = res.body.gatewayOrderId;
  });

  test('Step 9 & 10: Receive, verify, and idempotently process provider webhook', async () => {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_test_webhook_secret';
    const eventId = `evt_${Date.now()}`;
    const paymentId = `pay_${Date.now()}`;

    // Payload represents 1180.00 INR (118000 paise in minor units)
    const webhookPayload = {
      id: eventId,
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: paymentId,
            order_id: gatewayOrderId,
            amount: 118000,
            currency: 'INR',
            status: 'captured',
            notes: {
              tenantId,
              invoiceId,
            },
          },
        },
      },
    };

    const rawString = JSON.stringify(webhookPayload);
    const signature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawString)
      .digest('hex');

    // 1. Process valid webhook
    const res1 = await request(app.getHttpServer())
      .post('/api/payments/webhooks/razorpay')
      .set('x-razorpay-signature', signature)
      .set('Content-Type', 'application/json')
      .send(rawString)
      .expect(200);

    expect(res1.body.success).toBe(true);

    // Step 12: Re-send same webhook (Duplicate delivery / Retry test)
    const resDuplicate = await request(app.getHttpServer())
      .post('/api/payments/webhooks/razorpay')
      .set('x-razorpay-signature', signature)
      .set('Content-Type', 'application/json')
      .send(rawString)
      .expect(200);

    expect(resDuplicate.body.duplicate).toBe(true);
  });

  test('Step 11: View subscription, invoice and payment status', async () => {
    const invoiceRes = await request(app.getHttpServer())
      .get(`/api/invoices/${invoiceId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .set('x-tenant-id', tenantId)
      .expect(200);

    expect(invoiceRes.body.status).toBe('paid');
    expect(Number(invoiceRes.body.amountPaid)).toBe(1180);
    expect(Number(invoiceRes.body.amountDue)).toBe(0);
    expect(invoiceRes.body.payments.length).toBe(1);

    // Reporting dashboard check
    const reportRes = await request(app.getHttpServer())
      .get('/api/reporting/dashboard')
      .set('Authorization', `Bearer ${ownerToken}`)
      .set('x-tenant-id', tenantId)
      .expect(200);

    expect(reportRes.body.activeSubscriptions).toBe(1);
    expect(reportRes.body.mrr).toBe('1000.00'); // MRR excludes tax!
    expect(reportRes.body.invoicedRevenue).toBe('1180.00');
    expect(reportRes.body.collectedRevenue).toBe('1180.00');
    expect(reportRes.body.outstandingReceivables).toBe('0.00');
  });

  test('Step 13: Demonstrate Tenant B cannot access Tenant A records (Cross-tenant rejection)', async () => {
    // Tenant B attempts to read Tenant A customer
    await request(app.getHttpServer())
      .get(`/api/customers/${customerId}`)
      .set('Authorization', `Bearer ${tenantBToken}`)
      .set('x-tenant-id', tenantBId)
      .expect(404);

    // Tenant B attempts to supply Tenant A id in header without membership
    await request(app.getHttpServer())
      .get(`/api/customers/${customerId}`)
      .set('Authorization', `Bearer ${tenantBToken}`)
      .set('x-tenant-id', tenantId) // Bob has no membership in Acme!
      .expect(403);

    // Tenant B attempts to read Tenant A invoice
    await request(app.getHttpServer())
      .get(`/api/invoices/${invoiceId}`)
      .set('Authorization', `Bearer ${tenantBToken}`)
      .set('x-tenant-id', tenantBId)
      .expect(404);
  });
});
