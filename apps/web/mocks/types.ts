import {
  SubscriptionStatus,
  InvoiceStatus,
  ProductType,
  BillingInterval,
  PricingModel,
  PaymentMethod,
  DiscountType,
  TenantRole,
} from '@brightloop/shared-types';

export interface CustomerDTO {
  id: string;
  name: string;
  email: string;
  phone?: string;
  taxNumber?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country: string;
  currency: string;
  createdAt: string;
}

export interface ProductVariantDTO {
  id: string;
  productId: string;
  name: string;
  attributeName: string;
  attributeValue: string;
  priceAdjustment: string; // e.g. "250.00"
}

export interface ProductDTO {
  id: string;
  name: string;
  type: ProductType;
  salesPrice: string; // decimal string
  costPrice: string;  // internal cost price (TENANT_ADMIN only)
  notes?: string;
  description?: string;
  active: boolean;
  variants: ProductVariantDTO[];
}

export interface PlanDTO {
  id: string;
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  nickname: string;
  currency: string;
  unitAmount: string;
  billingInterval: BillingInterval;
  billingIntervalCount: number;
  pricingModel: PricingModel;
  taxRatePercentage: string;
  minQuantity: number;
  startDate?: string;
  endDate?: string;
  autoClose: boolean;
  allowPause: boolean;
  allowEarlyClose: boolean;
  active: boolean;
}

export interface DiscountDTO {
  id: string;
  code: string;
  name: string;
  type: DiscountType;
  value: string; // decimal string: "500.00" or "15" for 15%
  minPurchaseAmount: string;
  minQuantity: number;
  validFrom?: string;
  validTo?: string;
  maxUsageLimit?: number;
  usageCount: number;
  active: boolean;
  productId?: string;
}

export interface TemplateLineDTO {
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  unitPrice: string;
}

export interface QuotationTemplateDTO {
  id: string;
  name: string;
  description?: string;
  validForDays: number;
  lines: TemplateLineDTO[];
}

export interface TimelineEventDTO {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  actor: string;
  isSystemManaged?: boolean;
}

export interface SubscriptionLineItemDTO {
  id: string;
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  unitPrice: string;
  variantAdjustment: string;
  grossAmount: string;
  taxAmount: string;
  totalAmount: string;
}

export interface SubscriptionDTO {
  id: string;
  subscriptionNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  priceId: string;
  planNickname: string;
  billingInterval: BillingInterval;
  status: SubscriptionStatus;
  quantity: number;
  unitAmount: string;
  subtotal: string;
  discountCode?: string;
  discountAmount: string;
  taxAmount: string;
  totalAmount: string;
  currency: string;
  startDate: string;
  currentPeriodEnd: string;
  validUntil?: string; // Expiry for Quotation status
  timeline: TimelineEventDTO[];
  lines: SubscriptionLineItemDTO[];
}

export interface PaymentRecordDTO {
  id: string;
  invoiceId: string;
  amount: string;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  referenceNote?: string;
  recorderName: string;
  status: 'succeeded';
}

export interface InvoiceDTO {
  id: string;
  invoiceNumber: string;
  subscriptionId?: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerTaxNumber?: string;
  status: InvoiceStatus;
  currency: string;
  issueDate: string;
  dueDate: string;
  subtotal: string;
  discountAmount: string;
  taxAmount: string;
  totalAmount: string;
  paidAmount: string;
  outstandingBalance: string;
  isOverdue: boolean;
  lines: SubscriptionLineItemDTO[];
  payments: PaymentRecordDTO[];
}

export interface StaffMemberDTO {
  id: string;
  name: string;
  email: string;
  role: TenantRole;
  status: 'active' | 'invited';
  invitedAt: string;
  joinedAt?: string;
}

export interface DashboardMetricsDTO {
  mrr: string;
  collectedRevenue: string;
  outstandingReceivables: string;
  overdueReceivables: string;
  activeSubscriptions: number;
  draftQuotations: number;
  confirmedSubscriptions: number;
  closedSubscriptions: number;
  totalInvoices: number;
}
