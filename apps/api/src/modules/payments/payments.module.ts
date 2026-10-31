import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { RazorpayAdapter } from './razorpay.adapter';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, RazorpayAdapter],
  exports: [PaymentsService, RazorpayAdapter],
})
export class PaymentsModule {}
