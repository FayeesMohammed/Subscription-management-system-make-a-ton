import { Injectable, Logger } from '@nestjs/common';
import { PaymentGatewayAdapter, CreateOrderParams, GatewayOrderResult } from './payment-gateway.adapter';
import { toMinorUnits } from '@brightloop/financial-core';
import * as crypto from 'crypto';

@Injectable()
export class RazorpayAdapter implements PaymentGatewayAdapter {
  readonly gatewayName = 'razorpay';
  private readonly logger = new Logger(RazorpayAdapter.name);

  private readonly keyId: string;
  private readonly keySecret: string;
  private readonly webhookSecret: string;

  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_brightloop_key';
    this.keySecret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_brightloop_secret';
    this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_test_webhook_secret';
  }

  async createOrder(params: CreateOrderParams): Promise<GatewayOrderResult> {
    const minorUnits = toMinorUnits(params.amount, params.currency);
    const mockOrderId = `order_${crypto.randomBytes(8).toString('hex')}`;

    this.logger.log(`Created Razorpay sandbox order ${mockOrderId} for invoice ${params.invoiceNumber} (${minorUnits} minor units)`);

    return {
      gateway: this.gatewayName,
      gatewayOrderId: mockOrderId,
      amount: params.amount.toString(),
      currency: params.currency,
      rawResponse: {
        id: mockOrderId,
        entity: 'order',
        amount: Number(minorUnits),
        currency: params.currency,
        receipt: params.invoiceNumber,
        status: 'created',
        notes: {
          tenantId: params.tenantId,
          invoiceId: params.invoiceId,
        },
      },
    };
  }

  verifySignature(rawPayload: string, signature: string, secret?: string): boolean {
    const activeSecret = secret || this.webhookSecret;
    if (!activeSecret || !signature) {
      return false;
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', activeSecret)
        .update(rawPayload)
        .digest('hex');

      const expectedBuf = Buffer.from(expectedSignature, 'utf8');
      const actualBuf = Buffer.from(signature, 'utf8');

      if (expectedBuf.length !== actualBuf.length) {
        return false;
      }

      return crypto.timingSafeEqual(expectedBuf, actualBuf);
    } catch (err) {
      this.logger.error(`Signature verification failed: ${(err as Error).message}`);
      return false;
    }
  }
}
