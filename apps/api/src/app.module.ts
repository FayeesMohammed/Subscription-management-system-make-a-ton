import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { CustomersModule } from './modules/customers/customers.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { DiscountsModule } from './modules/discounts/discounts.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { UsageModule } from './modules/usage/usage.module';
import { ReportingModule } from './modules/reporting/reporting.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    AuthModule,
    TenantsModule,
    CustomersModule,
    CatalogModule,
    DiscountsModule,
    SubscriptionsModule,
    InvoicesModule,
    PaymentsModule,
    UsageModule,
    ReportingModule,
  ],
})
export class AppModule {}
