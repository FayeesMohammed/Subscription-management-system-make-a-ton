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

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  tenantName: z.string().min(2),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
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

export const CreateProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  active: z.boolean().default(true),
});

export const CreatePriceSchema = z.object({
  productId: z.string().uuid(),
  nickname: z.string().optional(),
  currency: z.string().length(3).default('INR'),
  unitAmount: z.coerce.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: 'unitAmount must be a non-negative decimal string',
  }),
  billingInterval: z.enum(['day', 'week', 'month', 'year']),
  billingIntervalCount: z.number().int().positive().default(1),
  pricingModel: z.enum(['fixed_recurring', 'per_unit', 'usage_metered', 'tiered_graduated', 'tiered_volume']).default('fixed_recurring'),
  taxRatePercentage: z.coerce.string().default('18'), // default GST rate in India
});

export const CreateSubscriptionSchema = z.object({
  customerId: z.string().uuid(),
  priceId: z.string().uuid(),
  quantity: z.number().int().positive().default(1),
  startDate: z.string().datetime().optional(),
  trialPeriodDays: z.number().int().min(0).default(0),
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
