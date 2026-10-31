import { z } from 'zod';

export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  DATABASE_APP_URL: z.string().min(1), // URL for brightloop_app (restricted RLS role)
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRATION: z.string().default('15m'),
  JWT_REFRESH_EXPIRATION: z.string().default('7d'),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
});

export type EnvConfig = z.infer<typeof EnvSchema>;

// GAP-01: Password Complexity
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
export const PASSWORD_ERROR_MESSAGE =
  'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one special character.';

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().regex(PASSWORD_REGEX, { message: PASSWORD_ERROR_MESSAGE }),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  tenantName: z.string().min(2),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const PasswordResetRequestSchema = z.object({
  email: z.string().email(),
});

export const PasswordResetConfirmSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().regex(PASSWORD_REGEX, { message: PASSWORD_ERROR_MESSAGE }),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const CreateCustomerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  taxNumber: z.string().optional(), // GSTIN or Tax ID
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().length(2).default('IN'), // ISO 2-letter
});

// GAP-03: Product with cost price & type
export const CreateProductSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['SOFTWARE', 'ADD_ON', 'PHYSICAL']).default('SOFTWARE'),
  salesPrice: z.coerce.string().default('0'),
  costPrice: z.coerce.string().default('0'),
  notes: z.string().optional(),
  description: z.string().optional(),
  active: z.boolean().default(true),
});

export const CreateProductVariantSchema = z.object({
  name: z.string().min(1),
  attributeName: z.string().min(1),
  attributeValue: z.string().min(1),
  priceAdjustment: z.coerce.string().default('0'),
});

// GAP-04: Plan Schedule Rules
export const CreatePriceSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  nickname: z.string().optional(),
  currency: z.string().length(3).default('INR'),
  unitAmount: z.coerce.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: 'unitAmount must be a non-negative decimal string',
  }),
  billingInterval: z.enum(['day', 'week', 'month', 'year']),
  billingIntervalCount: z.number().int().positive().default(1),
  pricingModel: z.enum(['fixed_recurring', 'per_unit', 'usage_metered', 'tiered_graduated', 'tiered_volume']).default('fixed_recurring'),
  taxRatePercentage: z.coerce.string().default('18'), // default GST rate in India
  minQuantity: z.number().int().positive().default(1),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  autoClose: z.boolean().default(false),
  allowPause: z.boolean().default(true),
  allowEarlyClose: z.boolean().default(true),
});

export const CreateSubscriptionSchema = z.object({
  customerId: z.string().uuid(),
  priceId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  quantity: z.number().int().positive().default(1),
  startDate: z.string().datetime().optional(),
  trialPeriodDays: z.number().int().min(0).default(0),
  discountCode: z.string().optional(),
});

// GAP-05: Quotations
export const CreateQuotationTemplateSchema = z.object({
  name: z.string().min(1),
  validForDays: z.number().int().positive().default(30),
  lines: z
    .array(
      z.object({
        productId: z.string().uuid(),
        variantId: z.string().uuid().optional(),
        quantity: z.number().int().positive().default(1),
      }),
    )
    .optional(),
});

export const CreateQuotationSchema = z.object({
  customerId: z.string().uuid(),
  priceId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  quantity: z.number().int().positive().default(1),
  validForDays: z.number().int().positive().default(30),
  discountCode: z.string().optional(),
});

// GAP-07: Discount Rules
export const CreateDiscountSchema = z.object({
  code: z.string().min(2).toUpperCase(),
  name: z.string().min(1),
  type: z.enum(['FIXED_AMOUNT', 'PERCENTAGE']),
  value: z.coerce.string().refine((val) => Number(val) > 0, { message: 'value must be positive' }),
  minPurchaseAmount: z.coerce.string().default('0'),
  minQuantity: z.number().int().default(1),
  validFrom: z.string().datetime().optional(),
  validTo: z.string().datetime().optional(),
  maxUsageLimit: z.number().int().positive().optional(),
  productId: z.string().uuid().optional(),
});

// GAP-08: Manual Payments
export const RecordManualPaymentSchema = z.object({
  amount: z.coerce.string().refine((val) => Number(val) > 0, { message: 'amount must be positive' }),
  paymentMethod: z.enum(['GATEWAY', 'BANK_TRANSFER', 'CASH', 'CHEQUE']).default('BANK_TRANSFER'),
  paymentDate: z.string().datetime().optional(),
  referenceNote: z.string().optional(),
});

export const UsageEventIngestionSchema = z.object({
  idempotencyKey: z.string().min(1),
  meterCode: z.string().min(1),
  customerId: z.string().uuid(),
  quantity: z.coerce.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'quantity must be positive decimal',
  }),
  timestamp: z.string().datetime().optional(),
});
