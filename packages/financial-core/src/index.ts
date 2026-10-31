import Decimal from 'decimal.js';

// Configure Decimal for financial precision
Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export { Decimal };

export interface CurrencyConfig {
  code: string;
  minorUnits: number; // e.g. 2 for USD, EUR, INR (100 paise = 1 INR); 0 for JPY
}

export const CURRENCIES: Record<string, CurrencyConfig> = {
  INR: { code: 'INR', minorUnits: 2 },
  USD: { code: 'USD', minorUnits: 2 },
  EUR: { code: 'EUR', minorUnits: 2 },
  GBP: { code: 'GBP', minorUnits: 2 },
  JPY: { code: 'JPY', minorUnits: 0 },
};

export function getCurrencyConfig(currency: string): CurrencyConfig {
  const upper = currency.toUpperCase();
  return CURRENCIES[upper] || { code: upper, minorUnits: 2 };
}

/**
 * Converts a decimal monetary amount to integer minor units (e.g. 10.50 INR -> 1050 paise)
 */
export function toMinorUnits(amount: Decimal.Value, currency = 'INR'): bigint {
  const config = getCurrencyConfig(currency);
  const factor = new Decimal(10).pow(config.minorUnits);
  const minor = new Decimal(amount).times(factor).round();
  return BigInt(minor.toFixed(0));
}

/**
 * Converts integer minor units back to a Decimal (e.g. 1050 paise -> 10.50 INR)
 */
export function fromMinorUnits(minorUnits: bigint | number | string, currency = 'INR'): Decimal {
  const config = getCurrencyConfig(currency);
  const factor = new Decimal(10).pow(config.minorUnits);
  return new Decimal(minorUnits.toString()).dividedBy(factor);
}

export interface LineItemCalculationInput {
  unitPrice: Decimal.Value;
  quantity: Decimal.Value;
  discountPercentage?: Decimal.Value;
  discountFixed?: Decimal.Value;
  taxRatePercentage?: Decimal.Value; // e.g. 18 for 18% GST
}

export interface LineItemCalculationResult {
  grossAmount: Decimal;
  discountAmount: Decimal;
  netAmount: Decimal;
  taxAmount: Decimal;
  totalAmount: Decimal;
}

/**
 * Calculates exact line item breakdown with strict decimal precision.
 */
export function calculateLineItem(input: LineItemCalculationInput): LineItemCalculationResult {
  const unitPrice = new Decimal(input.unitPrice);
  const quantity = new Decimal(input.quantity);
  const grossAmount = unitPrice.times(quantity);

  let discountAmount = new Decimal(0);
  if (input.discountPercentage) {
    const pct = new Decimal(input.discountPercentage).dividedBy(100);
    discountAmount = discountAmount.plus(grossAmount.times(pct));
  }
  if (input.discountFixed) {
    discountAmount = discountAmount.plus(new Decimal(input.discountFixed));
  }

  // Discount cannot exceed gross amount
  if (discountAmount.greaterThan(grossAmount)) {
    discountAmount = grossAmount;
  }

  const netAmount = grossAmount.minus(discountAmount);

  let taxAmount = new Decimal(0);
  if (input.taxRatePercentage) {
    const taxRate = new Decimal(input.taxRatePercentage).dividedBy(100);
    taxAmount = netAmount.times(taxRate);
  }

  const totalAmount = netAmount.plus(taxAmount);

  return {
    grossAmount: grossAmount.toDecimalPlaces(2),
    discountAmount: discountAmount.toDecimalPlaces(2),
    netAmount: netAmount.toDecimalPlaces(2),
    taxAmount: taxAmount.toDecimalPlaces(2),
    totalAmount: totalAmount.toDecimalPlaces(2),
  };
}

export interface ProrationInput {
  fullPeriodAmount: Decimal.Value;
  periodStart: Date;
  periodEnd: Date;
  effectiveDate: Date;
}

export interface ProrationResult {
  proratedAmount: Decimal;
  totalPeriodSeconds: number;
  consumedSeconds: number;
  remainingSeconds: number;
  fractionUsed: Decimal;
}

/**
 * Calculates second-precise prorated amount for mid-cycle changes.
 */
export function calculateProration(input: ProrationInput): ProrationResult {
  const startMs = input.periodStart.getTime();
  const endMs = input.periodEnd.getTime();
  const effectiveMs = input.effectiveDate.getTime();

  if (endMs <= startMs) {
    throw new Error('Proration periodEnd must be strictly greater than periodStart');
  }

  const totalSeconds = Math.floor((endMs - startMs) / 1000);
  const clampedEffectiveMs = Math.max(startMs, Math.min(endMs, effectiveMs));
  const consumedSeconds = Math.floor((clampedEffectiveMs - startMs) / 1000);
  const remainingSeconds = totalSeconds - consumedSeconds;

  const fractionRemaining = new Decimal(remainingSeconds).dividedBy(new Decimal(totalSeconds));
  const proratedAmount = new Decimal(input.fullPeriodAmount).times(fractionRemaining).toDecimalPlaces(2);

  return {
    proratedAmount,
    totalPeriodSeconds: totalSeconds,
    consumedSeconds,
    remainingSeconds,
    fractionUsed: new Decimal(consumedSeconds).dividedBy(new Decimal(totalSeconds)),
  };
}

export interface MRRItem {
  interval: 'day' | 'week' | 'month' | 'year';
  intervalCount?: number;
  unitPrice: Decimal.Value;
  quantity: Decimal.Value;
  discountPercentage?: Decimal.Value;
}

/**
 * Normalizes subscription items to Monthly Recurring Revenue (MRR).
 * Formula:
 * - monthly: netAmount / intervalCount
 * - yearly: (netAmount / 12) / intervalCount
 * - weekly: (netAmount * 52 / 12) / intervalCount
 * - daily: (netAmount * 365 / 12) / intervalCount
 */
export function calculateItemMRR(item: MRRItem): Decimal {
  const count = item.intervalCount && item.intervalCount > 0 ? item.intervalCount : 1;
  const line = calculateLineItem({
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    discountPercentage: item.discountPercentage,
  });
  const net = line.netAmount; // Excludes tax as per financial invariants!

  let mrr = new Decimal(0);
  switch (item.interval) {
    case 'month':
      mrr = net.dividedBy(count);
      break;
    case 'year':
      mrr = net.dividedBy(12 * count);
      break;
    case 'week':
      mrr = net.times(52).dividedBy(12 * count);
      break;
    case 'day':
      mrr = net.times(365).dividedBy(12 * count);
      break;
  }

  return mrr.toDecimalPlaces(2);
}
