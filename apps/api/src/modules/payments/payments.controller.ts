import {
  Controller,
  Post,
  Param,
  Body,
  Headers,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  RawBodyRequest,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { TenantContext } from '@brightloop/shared-types';
import { Request } from 'express';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('attempts')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async createAttempt(
    @CurrentTenant() tenant: TenantContext,
    @Body() body: any,
  ) {
    const invoiceId = body?.invoiceId;
    return this.paymentsService.createPaymentAttempt(tenant.tenantId, invoiceId);
  }

  @Post('webhooks/razorpay')
  @HttpCode(HttpStatus.OK)
  async handleRazorpayWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-razorpay-signature') signature: string,
    @Body() body: any,
  ) {
    // If rawBody is available from NestJS raw body parser use it, else stringify payload
    const rawString = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(body);
    return this.paymentsService.handleWebhook(rawString, signature);
  }
}
