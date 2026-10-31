import Decimal from 'decimal.js';
import {
  SubscriptionStatus,
  InvoiceStatus,
  PaymentMethod,
  TenantRole,
} from '@brightloop/shared-types';
import type {
  CustomerDTO,
  ProductDTO,
  PlanDTO,
  DiscountDTO,
  QuotationTemplateDTO,
  SubscriptionDTO,
  InvoiceDTO,
  PaymentRecordDTO,
  StaffMemberDTO,
  DashboardMetricsDTO,
} from './types.ts';
import {
  INITIAL_CUSTOMERS,
  INITIAL_PRODUCTS,
  INITIAL_PLANS,
  INITIAL_DISCOUNTS,
  INITIAL_TEMPLATES,
  INITIAL_SUBSCRIPTIONS,
  INITIAL_INVOICES,
  INITIAL_STAFF,
} from './fixtures.ts';
import { calculateLineItem } from '@brightloop/financial-core';

export type MockScenario =
  | 'CONFIGURED_TENANT'
  | 'EMPTY_TENANT'
  | 'QUOTE_NEAR_EXPIRY'
  | 'UNAVAILABLE_PLAN'
  | 'PARTIAL_PAYMENT'
  | 'OVERDUE_INVOICE'
  | 'LOCKED_INVOICE'
  | 'PORTAL_EMPTY';

class MockRepository {
  private currentScenario: MockScenario = 'CONFIGURED_TENANT';
  private customers: CustomerDTO[] = [];
  private products: ProductDTO[] = [];
  private plans: PlanDTO[] = [];
  private discounts: DiscountDTO[] = [];
  private templates: QuotationTemplateDTO[] = [];
  private subscriptions: SubscriptionDTO[] = [];
  private invoices: InvoiceDTO[] = [];
  private staff: StaffMemberDTO[] = [];

  constructor() {
    this.resetToScenario('CONFIGURED_TENANT');
  }

  public getScenario(): MockScenario {
    return this.currentScenario;
  }

  public resetToScenario(scenario: MockScenario) {
    this.currentScenario = scenario;

    if (scenario === 'EMPTY_TENANT') {
      this.customers = [];
      this.products = [];
      this.plans = [];
      this.discounts = [];
      this.templates = [];
      this.subscriptions = [];
      this.invoices = [];
      this.staff = [
        {
          id: 'staff-001',
          name: 'Vikram Mehta',
          email: 'vikram.mehta@acmesaas.in',
          role: TenantRole.TENANT_ADMIN,
          status: 'active',
          invitedAt: '2026-01-01T00:00:00Z',
          joinedAt: '2026-01-01T00:00:00Z',
        },
      ];
      return;
    }

    // Default deep copy fixtures
    this.customers = JSON.parse(JSON.stringify(INITIAL_CUSTOMERS));
    this.products = JSON.parse(JSON.stringify(INITIAL_PRODUCTS));
    this.plans = JSON.parse(JSON.stringify(INITIAL_PLANS));
    this.discounts = JSON.parse(JSON.stringify(INITIAL_DISCOUNTS));
    this.templates = JSON.parse(JSON.stringify(INITIAL_TEMPLATES));
    this.subscriptions = JSON.parse(JSON.stringify(INITIAL_SUBSCRIPTIONS));
    this.invoices = JSON.parse(JSON.stringify(INITIAL_INVOICES));
    this.staff = JSON.parse(JSON.stringify(INITIAL_STAFF));

    if (scenario === 'QUOTE_NEAR_EXPIRY') {
      // Set quote sub-202 validUntil to 2 hours from now
      const targetSub = this.subscriptions.find((s) => s.id === 'sub-202');
      if (targetSub) {
        const nearExpiry = new Date(Date.now() + 2 * 3600 * 1000).toISOString();
        targetSub.validUntil = nearExpiry;
      }
    } else if (scenario === 'UNAVAILABLE_PLAN') {
      // Mark all plans except 1 as inactive
      this.plans = this.plans.map((p, idx) => ({
        ...p,
        active: idx === 0,
      }));
    } else if (scenario === 'PORTAL_EMPTY') {
      // Customer cust-101 has zero records
      this.subscriptions = this.subscriptions.filter((s) => s.customerId !== 'cust-101');
      this.invoices = this.invoices.filter((i) => i.customerId !== 'cust-101');
    }
  }

  // CUSTOMERS
  public async getCustomers(query?: string): Promise<CustomerDTO[]> {
    if (!query) return [...this.customers];
    const q = query.toLowerCase();
    return this.customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.taxNumber?.toLowerCase().includes(q),
    );
  }

  public async getCustomerById(id: string): Promise<CustomerDTO | undefined> {
    return this.customers.find((c) => c.id === id);
  }

  public async createCustomer(data: Omit<CustomerDTO, 'id' | 'createdAt'>): Promise<CustomerDTO> {
    const newCustomer: CustomerDTO = {
      ...data,
      id: `cust-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.customers.unshift(newCustomer);
    return newCustomer;
  }

  // PRODUCTS & VARIANTS
  public async getProducts(): Promise<ProductDTO[]> {
    return [...this.products];
  }

  public async getProductById(id: string): Promise<ProductDTO | undefined> {
    return this.products.find((p) => p.id === id);
  }

  public async createProduct(data: Omit<ProductDTO, 'id' | 'variants'>): Promise<ProductDTO> {
    const newProduct: ProductDTO = {
      ...data,
      id: `prod-${Date.now()}`,
      variants: [],
    };
    this.products.unshift(newProduct);
    return newProduct;
  }

  public async addProductVariant(
    productId: string,
    variant: Omit<ProductDTO['variants'][0], 'id' | 'productId'>,
  ): Promise<ProductDTO['variants'][0]> {
    const prod = this.products.find((p) => p.id === productId);
    if (!prod) throw new Error('Product not found');
    const newVariant = {
      ...variant,
      id: `var-${Date.now()}`,
      productId,
    };
    prod.variants.push(newVariant);
    return newVariant;
  }

  // PLANS
  public async getPlans(): Promise<PlanDTO[]> {
    return [...this.plans];
  }

  public async getPlanById(id: string): Promise<PlanDTO | undefined> {
    return this.plans.find((p) => p.id === id);
  }

  public async createPlan(data: Omit<PlanDTO, 'id'>): Promise<PlanDTO> {
    const newPlan: PlanDTO = {
      ...data,
      id: `plan-${Date.now()}`,
    };
    this.plans.unshift(newPlan);
    return newPlan;
  }

  // DISCOUNTS (Admin-Only Mutation)
  public async getDiscounts(): Promise<DiscountDTO[]> {
    return [...this.discounts];
  }

  public async getDiscountByCode(code: string): Promise<DiscountDTO | undefined> {
    return this.discounts.find((d) => d.code.toUpperCase() === code.toUpperCase() && d.active);
  }

  public async createDiscount(data: Omit<DiscountDTO, 'id' | 'usageCount'>): Promise<DiscountDTO> {
    const newDiscount: DiscountDTO = {
      ...data,
      id: `disc-${Date.now()}`,
      code: data.code.toUpperCase(),
      usageCount: 0,
    };
    this.discounts.unshift(newDiscount);
    return newDiscount;
  }

  // QUOTATION TEMPLATES
  public async getTemplates(): Promise<QuotationTemplateDTO[]> {
    return [...this.templates];
  }

  public async getTemplateById(id: string): Promise<QuotationTemplateDTO | undefined> {
    return this.templates.find((t) => t.id === id);
  }

  public async createTemplate(data: Omit<QuotationTemplateDTO, 'id'>): Promise<QuotationTemplateDTO> {
    const newTmpl: QuotationTemplateDTO = {
      ...data,
      id: `tmpl-${Date.now()}`,
    };
    this.templates.unshift(newTmpl);
    return newTmpl;
  }

  // SUBSCRIPTIONS & QUOTES
  public async getSubscriptions(customerId?: string): Promise<SubscriptionDTO[]> {
    if (customerId) {
      return this.subscriptions.filter((s) => s.customerId === customerId);
    }
    return [...this.subscriptions];
  }

  public async getSubscriptionById(id: string): Promise<SubscriptionDTO | undefined> {
    return this.subscriptions.find((s) => s.id === id);
  }

  public async createSubscriptionDraft(
    data: {
      customerId: string;
      priceId: string;
      variantId?: string;
      quantity: number;
      discountCode?: string;
      asQuotation?: boolean;
    },
    creatorName = 'Priya Sharma (Staff)',
  ): Promise<SubscriptionDTO> {
    const customer = this.customers.find((c) => c.id === data.customerId);
    const plan = this.plans.find((p) => p.id === data.priceId);
    if (!customer || !plan) throw new Error('Customer or Plan not found');

    let unitPrice = new Decimal(plan.unitAmount);
    let variantAdjustment = new Decimal(0);

    if (data.variantId) {
      const prod = this.products.find((p) => p.id === plan.productId);
      const variant = prod?.variants.find((v) => v.id === data.variantId);
      if (variant) {
        variantAdjustment = new Decimal(variant.priceAdjustment);
        unitPrice = unitPrice.plus(variantAdjustment);
      }
    }

    const calc = calculateLineItem({
      unitPrice,
      quantity: data.quantity,
      taxRatePercentage: plan.taxRatePercentage,
    });

    let discountAmount = new Decimal(0);
    if (data.discountCode) {
      const discount = await this.getDiscountByCode(data.discountCode);
      if (discount) {
        if (discount.type === 'PERCENTAGE') {
          discountAmount = calc.grossAmount.times(new Decimal(discount.value).dividedBy(100));
        } else {
          discountAmount = new Decimal(discount.value);
        }
      }
    }

    const subtotal = calc.grossAmount;
    const netAmount = subtotal.minus(discountAmount).greaterThan(0)
      ? subtotal.minus(discountAmount)
      : new Decimal(0);
    const taxAmount = netAmount.times(new Decimal(plan.taxRatePercentage).dividedBy(100));
    const totalAmount = netAmount.plus(taxAmount);

    const initialStatus = data.asQuotation
      ? SubscriptionStatus.QUOTATION
      : SubscriptionStatus.DRAFT;

    const validUntil = data.asQuotation
      ? new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString()
      : undefined;

    const newSub: SubscriptionDTO = {
      id: `sub-${Date.now()}`,
      subscriptionNumber: `SUB-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      priceId: plan.id,
      planNickname: plan.nickname,
      billingInterval: plan.billingInterval,
      status: initialStatus,
      quantity: data.quantity,
      unitAmount: unitPrice.toFixed(2),
      subtotal: subtotal.toFixed(2),
      discountCode: data.discountCode,
      discountAmount: discountAmount.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      currency: plan.currency,
      startDate: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      validUntil,
      timeline: [
        {
          id: `evt-${Date.now()}`,
          title: data.asQuotation ? 'Quotation Issued' : 'Draft Created',
          description: data.asQuotation
            ? 'Commercial quotation created with 30-day validity.'
            : 'Initial commercial proposal created.',
          timestamp: new Date().toISOString(),
          actor: creatorName,
        },
      ],
      lines: [
        {
          id: `line-${Date.now()}`,
          productId: plan.productId,
          productName: plan.productName,
          variantId: data.variantId,
          variantName: plan.variantName,
          quantity: data.quantity,
          unitPrice: unitPrice.toFixed(2),
          variantAdjustment: variantAdjustment.toFixed(2),
          grossAmount: subtotal.toFixed(2),
          taxAmount: taxAmount.toFixed(2),
          totalAmount: totalAmount.toFixed(2),
        },
      ],
    };

    this.subscriptions.unshift(newSub);
    return newSub;
  }

  public async transitionSubscription(
    id: string,
    targetStatus: SubscriptionStatus,
    actorName: string,
  ): Promise<SubscriptionDTO> {
    const sub = this.subscriptions.find((s) => s.id === id);
    if (!sub) throw new Error('Subscription not found');

    const prevStatus = sub.status;
    sub.status = targetStatus;

    sub.timeline.push({
      id: `evt-${Date.now()}`,
      title: `Status: ${targetStatus.toUpperCase()}`,
      description: `Transitioned from ${prevStatus.toUpperCase()} to ${targetStatus.toUpperCase()}.`,
      timestamp: new Date().toISOString(),
      actor: actorName,
    });

    // If activated, generate first invoice automatically
    if (targetStatus === SubscriptionStatus.ACTIVE) {
      const invNum = `INV-2026-${Math.floor(100 + Math.random() * 900)}`;
      const newInvoice: InvoiceDTO = {
        id: `inv-${Date.now()}`,
        invoiceNumber: invNum,
        subscriptionId: sub.id,
        customerId: sub.customerId,
        customerName: sub.customerName,
        customerEmail: sub.customerEmail,
        status: InvoiceStatus.DRAFT,
        currency: sub.currency,
        issueDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
        subtotal: sub.subtotal,
        discountAmount: sub.discountAmount,
        taxAmount: sub.taxAmount,
        totalAmount: sub.totalAmount,
        paidAmount: '0.00',
        outstandingBalance: sub.totalAmount,
        isOverdue: false,
        lines: [...sub.lines],
        payments: [],
      };
      this.invoices.unshift(newInvoice);
    }

    return sub;
  }

  // INVOICES & MANUAL PAYMENTS
  public async getInvoices(customerId?: string): Promise<InvoiceDTO[]> {
    if (customerId) {
      return this.invoices.filter((i) => i.customerId === customerId);
    }
    return [...this.invoices];
  }

  public async getInvoiceById(id: string): Promise<InvoiceDTO | undefined> {
    return this.invoices.find((i) => i.id === id);
  }

  public async confirmInvoice(id: string): Promise<InvoiceDTO> {
    const invoice = this.invoices.find((i) => i.id === id);
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new Error('Only DRAFT invoices can be confirmed');
    }
    invoice.status = InvoiceStatus.CONFIRMED;
    return invoice;
  }

  public async voidInvoice(id: string): Promise<InvoiceDTO> {
    const invoice = this.invoices.find((i) => i.id === id);
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.status === InvoiceStatus.PAID) {
      throw new Error('Settled/PAID invoices cannot be voided directly; use credit notes.');
    }
    invoice.status = InvoiceStatus.VOID;
    return invoice;
  }

  public async recordManualPayment(
    invoiceId: string,
    data: {
      amount: string;
      paymentMethod: PaymentMethod;
      paymentDate?: string;
      referenceNote?: string;
      recorderName: string;
    },
  ): Promise<{ invoice: InvoiceDTO; payment: PaymentRecordDTO }> {
    const invoice = this.invoices.find((i) => i.id === invoiceId);
    if (!invoice) throw new Error('Invoice not found');

    if (invoice.status === InvoiceStatus.VOID) {
      throw new Error('Cannot record payments against a VOID invoice.');
    }

    const payDec = new Decimal(data.amount);
    if (payDec.lessThanOrEqualTo(0)) {
      throw new Error('Payment amount must be greater than zero.');
    }

    const currentPaid = new Decimal(invoice.paidAmount);
    const total = new Decimal(invoice.totalAmount);
    const newPaid = currentPaid.plus(payDec);

    if (newPaid.greaterThan(total)) {
      throw new Error(
        `Payment amount (${payDec.toFixed(2)}) exceeds outstanding balance (${total.minus(currentPaid).toFixed(2)})`,
      );
    }

    const newOutstanding = total.minus(newPaid);

    const paymentRecord: PaymentRecordDTO = {
      id: `pay-${Date.now()}`,
      invoiceId: invoice.id,
      amount: payDec.toFixed(2),
      paymentMethod: data.paymentMethod,
      paymentDate: data.paymentDate || new Date().toISOString(),
      referenceNote: data.referenceNote,
      recorderName: data.recorderName,
      status: 'succeeded',
    };

    invoice.payments.push(paymentRecord);
    invoice.paidAmount = newPaid.toFixed(2);
    invoice.outstandingBalance = newOutstanding.toFixed(2);

    if (newOutstanding.isZero()) {
      invoice.status = InvoiceStatus.PAID;
      invoice.isOverdue = false;
    }

    return { invoice, payment: paymentRecord };
  }

  // STAFF GOVERNANCE (Admin Only)
  public async getStaff(): Promise<StaffMemberDTO[]> {
    return [...this.staff];
  }

  public async inviteStaff(data: { name: string; email: string; role: TenantRole }): Promise<StaffMemberDTO> {
    const newMember: StaffMemberDTO = {
      id: `staff-${Date.now()}`,
      name: data.name,
      email: data.email,
      role: data.role,
      status: 'invited',
      invitedAt: new Date().toISOString(),
    };
    this.staff.unshift(newMember);
    return newMember;
  }

  // DASHBOARD & FINANCIAL METRICS
  public async getDashboardMetrics(): Promise<DashboardMetricsDTO> {
    let collectedRevenue = new Decimal(0);
    let outstandingReceivables = new Decimal(0);
    let overdueReceivables = new Decimal(0);

    for (const inv of this.invoices) {
      if (inv.status !== InvoiceStatus.VOID) {
        collectedRevenue = collectedRevenue.plus(new Decimal(inv.paidAmount));
        outstandingReceivables = outstandingReceivables.plus(new Decimal(inv.outstandingBalance));
        if (inv.isOverdue) {
          overdueReceivables = overdueReceivables.plus(new Decimal(inv.outstandingBalance));
        }
      }
    }

    // Calculate MRR from active subscriptions
    let mrr = new Decimal(0);
    let activeCount = 0;
    let quotationCount = 0;
    let confirmedCount = 0;
    let closedCount = 0;

    for (const sub of this.subscriptions) {
      if (sub.status === SubscriptionStatus.ACTIVE) {
        activeCount++;
        const total = new Decimal(sub.totalAmount);
        if (sub.billingInterval === 'year') {
          mrr = mrr.plus(total.dividedBy(12));
        } else if (sub.billingInterval === 'week') {
          mrr = mrr.plus(total.times(52).dividedBy(12));
        } else {
          mrr = mrr.plus(total);
        }
      } else if (sub.status === SubscriptionStatus.QUOTATION) {
        quotationCount++;
      } else if (sub.status === SubscriptionStatus.CONFIRMED) {
        confirmedCount++;
      } else if (sub.status === SubscriptionStatus.CLOSED) {
        closedCount++;
      }
    }

    return {
      mrr: mrr.toFixed(2),
      collectedRevenue: collectedRevenue.toFixed(2),
      outstandingReceivables: outstandingReceivables.toFixed(2),
      overdueReceivables: overdueReceivables.toFixed(2),
      activeSubscriptions: activeCount,
      draftQuotations: quotationCount,
      confirmedSubscriptions: confirmedCount,
      closedSubscriptions: closedCount,
      totalInvoices: this.invoices.length,
    };
  }
}

// Singleton repository for client & server mock operations
export const mockRepo = new MockRepository();
