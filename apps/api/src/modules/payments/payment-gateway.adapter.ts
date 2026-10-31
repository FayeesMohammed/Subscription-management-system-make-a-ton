import { Decimal, toMinorUnits } from '@brightloop/financial-core';

export interface CreateOrderParams {
  tenantId: string;
  invoiceId: string;
  invoiceNumber: string;
  amount: Decimal;
  currency: string;
  customerEmail: string;
}

export interface GatewayOrderResult {
  gateway: string;
  gatewayOrderId: string;
  amount: string;
  currency: string;
  rawResponse: Record<string, any>;
}

export interface PaymentGatewayAdapter {
  readonly gatewayName: string;
  createOrder(params: CreateOrderParams): Promise<GatewayOrderResult>;
  verifySignature(rawPayload: string, signature: string, secret?: string): boolean;
}
