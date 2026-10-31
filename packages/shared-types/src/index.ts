export enum TenantRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  TENANT_ADMIN = 'TENANT_ADMIN',
  STAFF = 'STAFF',
  TENANT_STAFF = 'TENANT_STAFF',
  FINANCE = 'FINANCE',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
  CUSTOMER_PORTAL = 'CUSTOMER_PORTAL',
}

export enum ProductType {
  SOFTWARE = 'SOFTWARE',
  ADD_ON = 'ADD_ON',
  PHYSICAL = 'PHYSICAL',
}

export enum SubscriptionStatus {
  DRAFT = 'draft',
  QUOTATION = 'quotation',
  CONFIRMED = 'confirmed',
  INCOMPLETE = 'incomplete',
  TRIALING = 'trialing',
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  PAUSED = 'paused',
  CLOSED = 'closed',
  CANCELED = 'canceled',
  UNPAID = 'unpaid',
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  CONFIRMED = 'confirmed',
  FINALIZED = 'finalized', // once finalized/confirmed, immutable snapshot!
  PAID = 'paid',
  VOID = 'void',
  UNCOLLECTIBLE = 'uncollectible',
}

export enum PaymentMethod {
  GATEWAY = 'GATEWAY',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CASH = 'CASH',
  CHEQUE = 'CHEQUE',
}

export enum DiscountType {
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  PERCENTAGE = 'PERCENTAGE',
}

export enum PaymentStatus {
  CREATED = 'created',
  PENDING = 'pending',
  AUTHORIZED = 'authorized',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  PARTIALLY_REFUNDED = 'partially_refunded',
  REFUNDED = 'refunded',
}

export enum BillingInterval {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
}

export enum PricingModel {
  FIXED_RECURRING = 'fixed_recurring',
  PER_UNIT = 'per_unit',
  USAGE_METERED = 'usage_metered',
  TIERED_GRADUATED = 'tiered_graduated',
  TIERED_VOLUME = 'tiered_volume',
}

export enum UsageAggregationType {
  SUM = 'sum',
  MAX = 'max',
  LAST = 'last',
  COUNT = 'count',
}

export enum WebhookEventStatus {
  RECEIVED = 'received',
  PROCESSING = 'processing',
  PROCESSED = 'processed',
  FAILED = 'failed',
  IGNORED = 'ignored',
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  isPlatformSuperuser?: boolean;
}

export interface TenantContext {
  tenantId: string;
  userId: string;
  role: TenantRole;
}
