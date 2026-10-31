-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('SOFTWARE', 'ADD_ON', 'PHYSICAL');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('GATEWAY', 'BANK_TRANSFER', 'CASH', 'CHEQUE');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('FIXED_AMOUNT', 'PERCENTAGE');

-- AlterEnum
ALTER TYPE "InvoiceStatus" ADD VALUE 'confirmed';

-- AlterEnum
ALTER TYPE "SubscriptionStatus" ADD VALUE 'draft';
ALTER TYPE "SubscriptionStatus" ADD VALUE 'quotation';
ALTER TYPE "SubscriptionStatus" ADD VALUE 'confirmed';
ALTER TYPE "SubscriptionStatus" ADD VALUE 'closed';

-- AlterEnum
ALTER TYPE "TenantRole" ADD VALUE 'TENANT_ADMIN';
ALTER TYPE "TenantRole" ADD VALUE 'STAFF';
ALTER TYPE "TenantRole" ADD VALUE 'TENANT_STAFF';
ALTER TYPE "TenantRole" ADD VALUE 'CUSTOMER_PORTAL';

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'GATEWAY',
ADD COLUMN     "recordedBy" UUID,
ADD COLUMN     "referenceNote" TEXT,
ALTER COLUMN "gatewayPaymentId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "prices" ADD COLUMN     "allowEarlyClose" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allowPause" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "autoClose" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "minQuantity" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "startDate" TIMESTAMP(3),
ADD COLUMN     "variantId" UUID;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "costPrice" DECIMAL(18,4) NOT NULL DEFAULT 0,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "salesPrice" DECIMAL(18,4) NOT NULL DEFAULT 0,
ADD COLUMN     "type" "ProductType" NOT NULL DEFAULT 'SOFTWARE';

-- AlterTable
ALTER TABLE "subscription_items" ADD COLUMN     "variantId" UUID;

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "appliedDiscountId" UUID,
ADD COLUMN     "autoClose" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "expiryDate" TIMESTAMP(3),
ALTER COLUMN "status" SET DEFAULT 'active';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "passwordResetExpires" TIMESTAMP(3),
ADD COLUMN     "passwordResetToken" TEXT;

-- CreateTable
CREATE TABLE "product_variants" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "attributeName" TEXT NOT NULL,
    "attributeValue" TEXT NOT NULL,
    "priceAdjustment" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotation_templates" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "validForDays" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quotation_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotation_template_lines" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "templateId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "variantId" UUID,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "quotation_template_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discounts" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "DiscountType" NOT NULL,
    "value" DECIMAL(18,4) NOT NULL,
    "minPurchaseAmount" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "minQuantity" INTEGER NOT NULL DEFAULT 1,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "maxUsageLimit" INTEGER,
    "currentUsageCount" INTEGER NOT NULL DEFAULT 0,
    "productId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_variants_tenantId_productId_idx" ON "product_variants"("tenantId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_tenantId_id_key" ON "product_variants"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "quotation_templates_tenantId_id_key" ON "quotation_templates"("tenantId", "id");

-- CreateIndex
CREATE INDEX "quotation_template_lines_tenantId_templateId_idx" ON "quotation_template_lines"("tenantId", "templateId");

-- CreateIndex
CREATE UNIQUE INDEX "quotation_template_lines_tenantId_id_key" ON "quotation_template_lines"("tenantId", "id");

-- CreateIndex
CREATE INDEX "discounts_tenantId_code_idx" ON "discounts"("tenantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "discounts_tenantId_id_key" ON "discounts"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "discounts_tenantId_code_key" ON "discounts"("tenantId", "code");

-- CreateIndex (GAP-09 Dashboard SLA Performance Indexes)
DROP INDEX IF EXISTS "invoices_tenantId_status_idx";
CREATE INDEX "invoices_tenantId_status_dueDate_idx" ON "invoices"("tenantId", "status", "dueDate");
CREATE INDEX "payments_tenantId_paymentDate_idx" ON "payments"("tenantId", "paymentDate");

-- CreateIndex
CREATE UNIQUE INDEX "users_passwordResetToken_key" ON "users"("passwordResetToken");

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_template_lines" ADD CONSTRAINT "quotation_template_lines_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "quotation_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Composite Tenant Foreign Keys for New Tables
ALTER TABLE "product_variants"
  ADD CONSTRAINT "product_variants_tenant_product_fk"
  FOREIGN KEY ("tenantId", "productId")
  REFERENCES "products"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "quotation_template_lines"
  ADD CONSTRAINT "quotation_template_lines_tenant_template_fk"
  FOREIGN KEY ("tenantId", "templateId")
  REFERENCES "quotation_templates"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Row Level Security (RLS) on New Tenant Tables
DO $$
DECLARE
  tbl text;
  new_tenant_tables text[] := ARRAY[
    'product_variants',
    'quotation_templates',
    'quotation_template_lines',
    'discounts'
  ];
BEGIN
  FOREACH tbl IN ARRAY new_tenant_tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I;', tbl || '_tenant_policy', tbl);
    EXECUTE format('
      CREATE POLICY %I ON %I
      FOR ALL
      USING ("tenantId" = NULLIF(current_setting(''app.current_tenant'', true), '''')::uuid)
      WITH CHECK ("tenantId" = NULLIF(current_setting(''app.current_tenant'', true), '''')::uuid);
    ', tbl || '_tenant_policy', tbl);
  END LOOP;
END
$$;

-- Grant permissions to brightloop_app
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO brightloop_app;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO brightloop_app;
