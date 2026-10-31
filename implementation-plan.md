# Brightloop Subscription Management System
## Revised Master Implementation Plan & Execution Blueprint

**Version:** 2.0 — Revised Architecture  
**Date:** 31 October 2026  
**Scope:** MVP with an architecture that supports future expansion  
**Architecture:** Modular monolith, multi-tenant SaaS, PostgreSQL, NestJS, Prisma, Next.js, Redis/BullMQ  
**Platform strategy:** Both hosted SaaS and deployable/self-hosted platform  
**Market strategy:** India and international markets  
**Billing strategy:** Fixed recurring, usage-based, and hybrid billing foundations  
**Payments:** Integrated payment gateways, beginning with a production-shaped sandbox integration

---

# 1. Executive summary

Brightloop is a subscription-management and recurring-billing platform for businesses. It supports tenant-separated organizations, customers, products, prices, subscriptions, invoices, payments, usage records and financial reporting.

The revised plan retains the original technology direction and eight-phase structure while strengthening security, financial correctness, operational reliability and implementation sequencing.

The most important change is that **tenant isolation, invoice integrity, payment idempotency and financial precision are treated as system invariants**, not optional implementation details.

The MVP must deliver a coherent end-to-end billing workflow before advanced pricing, international tax automation or extensive analytics are attempted.

## 1.1 Product decisions

| Decision | Final direction |
|---|---|
| Platform | Both hosted SaaS and deployable/self-hosted |
| Market | India and international |
| Billing | Fixed recurring, usage-based and hybrid foundations |
| Payments | Integrated gateways |
| Development scope | MVP first |
| Backend | NestJS modular monolith |
| Frontend | Next.js |
| Database | PostgreSQL |
| ORM | Prisma, with reviewed SQL migrations for RLS and database-specific controls |
| Queue/cache | Redis + BullMQ |
| Financial arithmetic | Decimal arithmetic; integer minor units at gateway boundaries |
| Tenant isolation | Application authorization plus PostgreSQL RLS |
| Deployment | Docker-based local and deployable environments |

## 1.2 MVP boundary

The MVP includes:

- Tenant registration/provisioning and membership.
- Authentication, sessions and tenant-scoped RBAC.
- Customer and product management.
- Versioned plans/prices and subscription items.
- Fixed recurring subscriptions and billing periods.
- Invoice draft, finalization and credit-note foundations.
- Integrated payment-provider adapter and sandbox payment flow.
- Verified, idempotent webhook processing.
- Basic usage-event ingestion and aggregation foundations.
- Basic billing dashboard and audit trail.
- Background jobs, retries, monitoring and reconciliation foundations.

The MVP does **not** attempt to deliver a complete tax-compliance suite for every jurisdiction, a full accounting/ERP ledger, every gateway, complex enterprise contracts, or every tiered/volume pricing permutation. Those require explicit follow-on releases.

---

# 2. Architecture principles and non-negotiable invariants

1. **PostgreSQL is the source of truth** for tenants, subscriptions, invoices, payments, usage records and financial state.
2. Redis is a queue/cache/coordination layer. It is never the authoritative record of money or payment state.
3. Every tenant-owned row is tenant-scoped and protected by server-side authorization and database RLS.
4. Tenant identity is derived from an authenticated user’s verified membership. A request header is only a tenant-selection hint, never proof of membership.
5. All financial calculations use decimal arithmetic or integer minor units. JavaScript floating-point values are not used for monetary calculations.
6. Invoice finalization is transactional and produces an immutable historical snapshot.
7. Issued invoices are corrected through credit notes/adjustments, not by rewriting the original invoice.
8. Payment and billing operations are idempotent at the database boundary.
9. External gateway calls are not performed inside long-running database transactions.
10. State changes are explicit, validated and audited.
11. Background processing is at-least-once; handlers must be safe under retries and duplicate delivery.
12. Tenant-scoped database access must use a transaction-local tenant context on the same database connection as the query.
13. Database application roles must not be superusers and must not have `BYPASSRLS`.
14. Deployable/self-hosted installations must have explicit tenant and operator boundaries; platform operators do not automatically receive access to tenant financial data.

---

# 3. Target system architecture

```text
                         NEXT.JS APPLICATION
             Admin Console | Customer Portal | Finance UI
                                  |
                                  v
                         NESTJS HTTP API
        Authentication | Tenant Resolution | RBAC | Validation
                                  |
             +--------------------+--------------------+
             |                    |                    |
             v                    v                    v
       DOMAIN MODULES        BILLING MODULES       PLATFORM MODULES
       Identity              Subscriptions         Audit
       Tenants               Invoices              Notifications
       Customers             Payments              Webhooks
       Catalog               Usage                 Reporting
       Pricing               Tax                   Jobs
             |                    |                    |
             +--------------------+--------------------+
                                  |
                       APPLICATION SERVICES
                 Transactions | Outbox | Idempotency
                                  |
                    +-------------+-------------+
                    |                           |
                    v                           v
                POSTGRESQL                  REDIS/BULLMQ
             RLS + constraints             Jobs + retries
             Financial records             Scheduling
             Outbox + inbox                Non-authoritative
                    |
                    v
           EXTERNAL PAYMENT PROVIDERS
             Razorpay | Stripe (later)
```

## 3.1 Modular monolith decision

Use one deployable NestJS API with strict module boundaries. Do not split into microservices for the MVP.

Each module owns its domain rules and persistence operations. Cross-module operations go through application services or explicit interfaces rather than importing another module’s Prisma internals.

## 3.2 Suggested repository structure

```text
brightloop/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── common/
│   │   │   ├── config/
│   │   │   ├── database/
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   ├── tenants/
│   │   │   │   ├── memberships/
│   │   │   │   ├── customers/
│   │   │   │   ├── catalog/
│   │   │   │   ├── pricing/
│   │   │   │   ├── taxes/
│   │   │   │   ├── subscriptions/
│   │   │   │   ├── billing/
│   │   │   │   ├── invoices/
│   │   │   │   ├── payments/
│   │   │   │   ├── webhooks/
│   │   │   │   ├── usage/
│   │   │   │   ├── collections/
│   │   │   │   ├── reporting/
│   │   │   │   ├── audit/
│   │   │   │   └── notifications/
│   │   │   └── workers/
│   │   └── test/
│   └── web/
│       ├── app/
│       ├── components/
│       ├── features/
│       ├── hooks/
│       └── lib/
├── packages/
│   ├── shared-types/
│   ├── validation/
│   └── financial-core/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── infra/
│   ├── docker/
│   └── scripts/
├── docs/
│   ├── architecture/
│   ├── adr/
│   └── runbooks/
├── docker-compose.yml
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

---

# 4. Phase 0 — Infrastructure, monorepo and engineering baseline

## Objective
Create a reproducible development environment and delivery pipeline before implementing business logic.

## Tasks
1. Establish pnpm workspace and Turborepo configuration.
2. Create Next.js frontend and NestJS API applications.
3. Configure strict TypeScript, ESLint and Prettier.
4. Add Docker Compose for PostgreSQL and Redis.
5. Add validated environment configuration.
6. Configure Prisma and migration workflow.
7. Add unit, integration and end-to-end test scaffolding.
8. Add CI pipeline for lint, typecheck, test and build.
9. Add structured logs, request IDs and health endpoints.
10. Document local setup and deployment profiles.

## Environment configuration
- Validate required variables at startup with Zod or an equivalent schema.
- Commit `.env.example`, never real `.env` secrets.
- Use deployment secret management for production.
- Separate application, migration and read-only/reporting database credentials where appropriate.
- Never use a PostgreSQL superuser as the runtime API role.

## Initial commands

```bash
mkdir brightloop && cd brightloop
pnpm init
mkdir -p apps packages

pnpm create nest-app apps/api
pnpm create next-app apps/web
```

Configure `pnpm-workspace.yaml`, `turbo.json` and root scripts before relying on workspace scripts.

Backend baseline dependencies (adjust versions to the selected NestJS major version):

```bash
cd apps/api
pnpm add @nestjs/config @nestjs/jwt @nestjs/passport \
  @nestjs/bullmq @prisma/client decimal.js argon2 zod
pnpm add -D prisma
```

## Acceptance criteria
- Fresh clone can start API, frontend, PostgreSQL and Redis using documented commands.
- Invalid or missing required environment variables fail fast.
- CI runs lint, typecheck, tests and builds.
- Health endpoints distinguish liveness from dependency readiness.
- No production secrets or privileged database credentials are committed.

---

# 5. Phase 1 — Database foundation and tenant isolation

## Objective
Establish a secure tenant-aware relational model and prove isolation before feature modules depend on it.

## 5.1 Core schema domains

### Identity and tenancy
- `users`
- `tenants`
- `tenant_members`
- `tenant_invitations`
- `sessions`
- `refresh_tokens`
- `password_reset_tokens`
- `email_verification_tokens`
- `tenant_settings`

### Customer and catalog
- `customers`
- `customer_contacts`
- `products`
- `plans`
- `plan_prices`
- `price_versions`
- `pricing_tiers`
- `tax_categories`
- `tax_configurations`

### Subscription and billing
- `subscriptions`
- `subscription_items`
- `subscription_status_log`
- `billing_periods`
- `billing_runs`
- `invoice_sequences`
- `invoices`
- `invoice_lines`
- `credit_notes`
- `credit_note_lines`
- `discounts`

### Payments and operations
- `payment_attempts`
- `payments`
- `refunds`
- `webhook_events`
- `outbox_events`
- `outbox_attempts`
- `idempotency_keys`
- `audit_log`
- `job_execution_logs`

### Usage
- `meters`
- `usage_events`
- `usage_aggregations`
- `usage_adjustments`

### Optional accounting expansion
- `ledger_accounts`
- `ledger_entries`

The ledger is a recommended follow-on if Brightloop will provide accounting-grade balance and reconciliation reports. Do not imply that invoice/payment tables alone constitute a complete accounting ledger.

## 5.2 Tenant ownership rules

- Every tenant-owned table includes `tenant_id NOT NULL`.
- Add indexes beginning with `tenant_id` for common tenant-scoped access paths.
- Use composite unique constraints such as `(tenant_id, id)` where needed.
- Use composite foreign keys such as `(tenant_id, customer_id)` to prevent cross-tenant relationships.
- Global reference tables must be explicitly identified and must not accidentally inherit tenant access.
- Audit and operational records must retain tenant attribution where applicable.

Example pattern:

```sql
ALTER TABLE customers
  ADD CONSTRAINT customers_tenant_id_id_unique
  UNIQUE (tenant_id, id);

ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_customer_same_tenant_fk
  FOREIGN KEY (tenant_id, customer_id)
  REFERENCES customers (tenant_id, id);
```

## 5.3 RLS policy pattern

Enable RLS on every tenant-owned table, not merely selected tables.

```sql
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers FORCE ROW LEVEL SECURITY;

CREATE POLICY customers_tenant_policy
ON customers
FOR ALL
USING (
  tenant_id =
  NULLIF(current_setting('app.current_tenant', true), '')::uuid
)
WITH CHECK (
  tenant_id =
  NULLIF(current_setting('app.current_tenant', true), '')::uuid
);
```

Repeat and verify for each tenant-owned table. Generate policies through reviewed migrations, not ad hoc runtime code.

Important:
- Runtime role must not be superuser and must not have `BYPASSRLS`.
- Test the exact runtime role.
- `FORCE ROW LEVEL SECURITY` does not constrain superusers or `BYPASSRLS` roles.
- Ensure tenant context is transaction-local and set on the same connection.
- Missing context must return no tenant rows and must not silently fall back to a default tenant.
- Background jobs must explicitly establish tenant context for each tenant-scoped operation.

## 5.4 Prisma transaction context

Use a transaction client and parameterized SQL. Do not interpolate tenant IDs into SQL strings.

```typescript
return prisma.$transaction(async (tx) => {
  await tx.$queryRaw`
    SELECT set_config(
      'app.current_tenant',
      ${tenantId},
      true
    )
  `;

  return callback(tx);
});
```

Validate tenant ID before entering the transaction. Do not perform tenant-scoped queries outside the transaction callback. Do not pass a root `PrismaClient` into tenant-scoped services.

## 5.5 Acceptance/security tests
- Tenant A cannot read, update or delete Tenant B rows.
- Tenant A cannot insert a row referencing Tenant B’s customer or subscription.
- Missing tenant context exposes zero tenant rows.
- A tenant ID supplied in a header without verified membership is rejected.
- RLS tests run as the actual restricted application role.
- Every tenant-owned table is included in an automated RLS coverage check.
- Background jobs cannot accidentally reuse a previous tenant context.
- Connection pooling does not leak tenant context between requests.

**Gate:** Do not proceed to tenant-facing business modules until all isolation tests pass.

---

# 6. Phase 2 — Authentication, tenant membership and authorization

## Objective
Implement identity separately from tenant membership and tenant-scoped permissions.

## Modules
- Auth
- Users
- Tenants
- Memberships
- Sessions
- Invitations
- Audit

## Features
1. Registration and email verification.
2. Login and logout.
3. Argon2 password hashing.
4. Short-lived access tokens.
5. Refresh-token rotation and reuse detection.
6. Session listing and revocation.
7. Tenant creation and provisioning.
8. Tenant invitation and acceptance.
9. Tenant selection.
10. Tenant-scoped RBAC.
11. Password reset.
12. Login and sensitive-action rate limiting.

## Authorization flow

```text
Authenticate user
      |
      v
Resolve requested tenant
      |
      v
Verify active membership
      |
      v
Load tenant-scoped role/permissions
      |
      v
Authorize action
      |
      v
Establish transaction-local DB tenant context
      |
      v
Execute tenant-scoped operation
```

A tenant header is a selector only. Never treat it as authorization evidence.

Global platform roles and tenant membership roles must be separate. A user's global account role must not be confused with the `owner`, `finance`, `admin` or other tenant membership role.

## Security requirements
- Secure refresh-token storage (hash tokens at rest).
- Rotate refresh tokens and detect reuse.
- Revoke sessions on password reset and relevant security events.
- Rate-limit login, reset and invitation endpoints.
- Validate issuer, audience, expiry and signing algorithm for JWTs.
- Do not log credentials, tokens or payment secrets.
- Audit role changes, invitations and sensitive financial actions.

## Acceptance criteria
- A user cannot access a tenant without active membership.
- Removing membership revokes tenant access on subsequent requests.
- Refresh-token reuse is detected and the affected session family is revoked.
- Tenant permissions are checked for every protected action.
- Authentication and authorization tests cover positive and negative cases.

---

# 7. Phase 3 — Customer, catalog, pricing and tax foundations

## Objective
Build customer and product management with versioned pricing and an explicit tax boundary.

## Features
- Customer CRUD and billing details.
- Product CRUD.
- Plans and recurring price definitions.
- Currency and billing interval configuration.
- Price versioning.
- Fixed recurring pricing.
- Usage-based price definitions.
- Hybrid subscription item definitions.
- Discount definitions.
- Tax category and tax configuration.
- Price preview and quote calculation.

## Pricing design
Represent billing models explicitly:
- Fixed recurring: fixed amount per billing interval.
- Per-unit: amount multiplied by billable quantity.
- Usage-based: amount based on aggregated meter quantity.
- Tiered: progressive or volume-based tiers, with the selected calculation mode explicit.
- Hybrid: combination of recurring and usage components.

Do not claim tiered/volume billing is supported until tier definitions, aggregation rules, rounding and tests exist.

## Historical correctness
- Subscription items reference a specific price/version.
- Price changes create new versions; they do not rewrite historical invoices.
- Store the applied unit price, quantity, currency and pricing rule snapshot on invoice lines.
- Define how future price changes affect existing subscriptions (grandfather, migrate immediately, or at next renewal).

## Tax engine boundary
Tax determination and tax arithmetic are separate concerns.

The tax determination input may include:
- Seller registration/jurisdiction.
- Customer location and tax identifiers.
- Place of supply.
- Product tax category/HSN/SAC where applicable.
- Transaction type.
- Exemption or reverse-charge status.
- Tax point/date.
- Currency and rounding policy.

The tax result must be snapshotted on the invoice line.

For India, GST handling must distinguish intra-state CGST/SGST, inter-state IGST, exports/zero-rated supplies, exempt supplies, reverse charge and other applicable cases. The exact rules must be validated with qualified tax expertise. International tax is jurisdiction-specific; do not assume every international sale is zero-tax.

## Acceptance criteria
- Price previews are deterministic.
- Currency precision is explicit.
- Price changes do not mutate prior invoices.
- Tax calculation is testable independently from tax determination.
- Unsupported tax scenarios fail explicitly rather than silently applying zero tax.

---

# 8. Phase 4 — Subscription lifecycle and proration

## Objective
Implement a validated subscription state machine and predictable billing periods.

## Core states
Define and document the allowed states, for example:
- `incomplete`
- `trialing`
- `active`
- `past_due`
- `paused`
- `canceled`
- `unpaid`

The exact set must be finalized before implementation. Do not maintain duplicated state in both a `status` field and a separate `paused` boolean unless a clear invariant is defined.

## Operations
- Create subscription.
- Start trial.
- Activate after successful payment or configured collection policy.
- Renew.
- Change plan/quantity.
- Pause/resume.
- Cancel immediately or at period end.
- Handle payment failure.
- Recover from past-due.
- End trial.
- Record every transition with actor, reason, timestamp and metadata.

## Concurrency
- Use transactions and optimistic concurrency/version fields or row locking for transitions.
- Enforce allowed transitions in a domain service.
- Write status log and state update atomically.
- Use idempotency keys for externally retried commands.
- Never allow two concurrent workers to create two renewals for the same billing period.

## Proration
Specify:
- Calendar-day or exact-elapsed-time basis.
- Billing timezone and anchor.
- Rounding mode.
- Effective date boundaries.
- Treatment of taxes and discounts.
- Whether credits are applied immediately or on next invoice.

Validate period duration is positive and effective date is within the supported range. Reject invalid or reversed periods. Store the proration calculation inputs and result for auditability.

## Acceptance criteria
- Invalid state transitions fail.
- Concurrent state transitions cannot corrupt state.
- Replayed commands have one effect.
- Proration tests cover start, end, exact boundary, leap year, timezone and invalid dates.
- Renewal is unique per subscription and billing period.

---

# 9. Phase 5 — Billing scheduler, invoice calculation and immutable invoices

## Objective
Generate correct invoices from subscription items and usage, with transactional finalization.

## Billing workflow

```text
Find subscriptions due
        |
        v
Create/claim billing run
        |
        v
Load subscription + price snapshots
        |
        v
Aggregate billable usage
        |
        v
Calculate discounts and tax
        |
        v
Create invoice draft
        |
        v
Validate totals and line items
        |
        v
Allocate invoice number
        |
        v
Finalize invoice transactionally
        |
        v
Write outbox event
        |
        v
Send invoice / initiate collection
```

## Requirements
1. Replace hardcoded invoice amounts with domain calculation.
2. Calculate from subscription items, quantities, price versions, discounts, usage and tax snapshots.
3. Store subtotal, discount, tax and total in exact decimal or minor-unit representation.
4. Store currency on every financial record.
5. Use a unique idempotency key for the billing period.
6. Update billing period and next billing date atomically with invoice finalization.
7. Keep gateway calls outside the database transaction.
8. Use a transactional outbox for downstream work.
9. Handle retries and partial failures.
10. Maintain immutable finalized invoices.
11. Use credit notes for corrections.
12. Define cancellation, voiding and retention rules consistent with applicable law.

## Invoice numbering
- Use a tenant-scoped sequence with the required year/prefix dimensions.
- Allocate the number inside the invoice-finalization transaction.
- Create invoice and advance sequence atomically.
- Never delete issued invoice records.
- Define how voided/cancelled invoice numbers are retained.
- Do not promise gapless numbering without a documented legal and transactional policy.

## Database controls
- Remove cascade deletion paths that could erase finalized invoice lines.
- Use database triggers or restricted procedures/permissions to prevent updates/deletes after finalization.
- Keep draft editing separate from finalization.
- Finalization must be one controlled operation.

## Acceptance criteria
- Duplicate scheduler execution creates one invoice per billing period.
- Invoice totals equal the sum of their snapshotted components under the defined rounding policy.
- Finalized invoices cannot be edited or deleted by application roles.
- Billing date advances only when the corresponding billing action commits.
- A failure at any stage is recoverable without duplicate financial effects.

---

# 10. Phase 6 — Payment gateway integration

## Objective
Integrate payment providers through a secure adapter and durable payment state machine.

## MVP provider
Implement one provider first, selected according to the initial target customer and operating entity. Razorpay is a practical first candidate for an India-first MVP. Keep the adapter interface provider-neutral so Stripe can be added later.

## Adapter responsibilities
- Create order/payment intent.
- Fetch payment status.
- Verify provider signatures.
- Normalize provider events.
- Initiate refund.
- Fetch refund status.
- Support reconciliation.

Do not simulate provider order IDs in the production path. Mock providers belong only in tests.

## Webhook inbox
Persist every verified event with a unique `(provider, provider_event_id)` constraint.

Suggested fields:
- `id`
- `provider`
- `provider_event_id`
- `tenant_id` where reliably resolved
- `event_type`
- `payload`
- `signature_verified_at`
- `status`
- `received_at`
- `processed_at`
- `failure_reason`

Webhook handling:
1. Read raw request body where required by provider signature rules.
2. Verify signature using the configured secret.
3. Persist the event.
4. Deduplicate by provider event ID.
5. Process the event in a transaction.
6. Validate amount, currency, provider reference and expected payment state.
7. Update payment/invoice state using allowed transitions.
8. Write follow-up work to the outbox.
9. Return provider-appropriate acknowledgement.
10. Retry processing internally without accepting duplicate financial effects.

Use constant-time signature comparison where applicable. Never use a hardcoded fallback webhook secret.

## Payment state machine
Define explicit states such as:
- `created`
- `pending`
- `authorized`
- `succeeded`
- `failed`
- `partially_refunded`
- `refunded`

Transitions must be provider-aware and tolerate out-of-order webhook delivery. A delayed failure event must not overwrite a confirmed success without a provider-authoritative reconciliation decision.

## Reconciliation
- Scheduled provider status checks for unresolved payments.
- Compare provider settlements/transactions with local records where provider APIs support it.
- Quarantine mismatches.
- Record operator resolution and audit trail.
- Never silently force a local paid state based only on a browser redirect.

## Acceptance criteria
- Invalid signatures are rejected.
- Duplicate webhook events have one financial effect.
- Amount/currency mismatches are quarantined.
- Delayed and out-of-order events do not regress terminal states incorrectly.
- Refunds are recorded separately and linked to original payments.
- Sandbox end-to-end payment flow works.

---

# 11. Phase 7 — Usage, collections/dunning and reporting

## 11.1 Usage billing

### MVP foundations
- Meter definitions.
- Usage event ingestion.
- Event idempotency key.
- Tenant and customer association.
- Event timestamp and received timestamp.
- Quantity and unit.
- Aggregation windows.
- Usage corrections/adjustments.
- Period closing and invoice linkage.

### Reliability rules
- Duplicate event IDs are rejected or treated idempotently.
- Late events follow a documented cutoff/correction policy.
- Aggregation is repeatable and deterministic.
- Closed periods cannot silently change.
- Corrections are explicit adjustment records.
- Usage limits and overage behavior are defined.

Advanced tiered and volume pricing can be delivered after fixed and basic metered billing are verified.

## 11.2 Collections and dunning
- Configurable retry schedule.
- Retry eligibility and maximum attempts.
- Provider idempotency.
- Customer notifications.
- Grace period.
- Subscription transition policy.
- Manual retry/resolve action.
- Audit history.
- Recovery metrics.

A worker that only logs an attempt is not a dunning implementation. It must create or invoke a real payment attempt and record the outcome.

## 11.3 Reporting
MVP metrics:
- Invoiced revenue.
- Collected payments.
- Outstanding receivables.
- Active subscriptions.
- New and canceled subscriptions.
- Failed payments.
- Basic MRR.

MRR rules must be explicit:
- Define which subscription statuses count.
- Normalize billing intervals.
- Use the subscription’s actual price/version and item quantity.
- Account for discounts according to the reporting definition.
- Exclude taxes from revenue metrics unless explicitly reporting gross billings.
- Avoid joins that multiply subscription rows across all plan prices.
- Use decimal-safe aggregation and serialization.

MRR is a management metric, not automatically recognized accounting revenue. ARR and revenue recognition must have separately documented definitions.

## Acceptance criteria
- Duplicate usage events have one effect.
- Aggregation can be rerun deterministically.
- Dunning retries create real payment attempts.
- MRR tests cover monthly, annual, quantity, discount, status and multiple-price cases.
- Reports reconcile to underlying invoice/payment records within documented definitions.

---

# 12. Cross-cutting security and reliability requirements

## Security
- Threat model for tenant isolation, authentication, payment and operator access.
- Input validation at API boundaries.
- Parameterized SQL only.
- Least-privilege database roles.
- Secret rotation and environment separation.
- Rate limiting and abuse protection.
- Audit logging for sensitive operations.
- Dependency and container scanning.
- Secure CORS, cookies and security headers.
- No sensitive payloads in logs.

## Reliability
- Transactional outbox for committed domain events.
- Durable webhook inbox.
- Idempotency keys for billing and payment commands.
- Bounded retries with backoff and dead-letter handling.
- Reconciliation jobs.
- Job execution records and operational dashboards.
- Database backup and restore drills.
- Migration rollback/forward-fix strategy.
- Graceful shutdown of workers.

## Observability
- Structured JSON logs.
- Request/correlation IDs.
- Queue latency and failure metrics.
- Billing run metrics.
- Webhook processing metrics.
- Payment reconciliation mismatches.
- Database connection pool metrics.
- Error monitoring and alerting.

---

# 13. Revised database design rules

These rules apply across the schema.

| Concern | Required design |
|---|---|
| Tenant-owned data | `tenant_id NOT NULL`, RLS, tenant-aware constraints |
| Relationships | Composite tenant-aware foreign keys where applicable |
| Money | Decimal or integer minor units; explicit currency |
| Currency precision | Currency-specific exponent and rounding policy |
| Historical prices | Versioned prices and immutable snapshots |
| Invoices | Draft/finalized lifecycle; immutable after finalization |
| Corrections | Credit notes/adjustments, not invoice rewrites |
| Payments | Separate payment attempts, successful payments and refunds |
| Webhooks | Durable inbox and unique provider event ID |
| Domain events | Transactional outbox |
| Idempotency | Database-enforced unique keys and stored outcomes |
| Audit | Actor, tenant, action, entity, timestamp and safe metadata |
| Usage | Event identity, event time, received time and correction trail |
| Reporting | Explicit metric definitions and decimal-safe aggregation |

---

# 14. Implementation dependencies

```text
Phase 0: Infrastructure
   |
   v
Phase 1: Database + RLS
   |
   v
Phase 2: Identity + Tenant Authorization
   |
   v
Phase 3: Customers + Catalog + Pricing + Tax
   |
   v
Phase 4: Subscription Lifecycle
   |
   v
Phase 5: Billing + Immutable Invoices
   |
   v
Phase 6: Payment Integration
   |
   v
Phase 7: Usage + Dunning + Reporting
```

Parallel work is allowed only where dependencies are stable:
- Frontend shell can proceed alongside backend infrastructure.
- Design system and API contracts can be developed in parallel.
- Tax research can proceed alongside catalog work.
- Payment adapter contracts can be prepared before invoice finalization, but live payment collection depends on stable invoice/payment domain models.
- Reporting UI can be built with fixtures, but production metrics depend on finalized definitions.

---

# 15. Testing strategy and release gates

## Test layers
- Unit: domain calculations and state machines.
- Integration: Prisma, PostgreSQL, RLS and transaction behavior.
- API: authorization and endpoint behavior.
- Worker: retries, duplicate jobs and failure recovery.
- Gateway: provider sandbox and webhook signature tests.
- E2E: tenant onboarding through invoice and payment.
- Security: cross-tenant access and privilege boundary tests.

## Mandatory acceptance matrix

| Scenario | Expected outcome |
|---|---|
| Tenant A reads Tenant B customer | Denied |
| Tenant A inserts relationship to Tenant B customer | Denied |
| Missing tenant context | No tenant data returned |
| Header specifies unjoined tenant | Rejected |
| Two invoice workers process same period | One invoice |
| Duplicate webhook event | One financial effect |
| Invalid webhook signature | Rejected |
| Payment amount/currency mismatch | Quarantined |
| Finalized invoice update/delete | Rejected |
| Credit note created | Original invoice unchanged |
| Invalid subscription transition | Rejected |
| Duplicate usage event | One accepted event |
| Late usage event after close | Documented adjustment path |
| MRR with multiple price records | No join multiplication |
| Database/Redis outage | No lost committed financial state |
| Worker restarts mid-job | Safe retry |

## Release gates
- **Gate 0:** Reproducible environment and CI.
- **Gate 1:** RLS and tenant isolation proven using restricted runtime role.
- **Gate 2:** Authentication and membership authorization complete.
- **Gate 3:** Pricing and tax calculation tests pass.
- **Gate 4:** Subscription state and proration tests pass.
- **Gate 5:** Invoice finalization, immutability and duplicate billing tests pass.
- **Gate 6:** Payment sandbox, webhook and reconciliation tests pass.
- **Gate 7:** Usage, dunning and reporting acceptance tests pass.

A phase is not complete merely because its endpoints exist. Its acceptance tests and operational behavior must pass.

---

# 16. Deployment strategy: hosted and self-hosted

## Hosted SaaS
- Shared application deployment.
- Shared PostgreSQL cluster with strict RLS and tenant constraints.
- Tenant-aware background workers.
- Centralized monitoring.
- Managed secrets and backups.
- Tenant-level usage and operational controls.

## Self-hosted
- Versioned Docker images.
- Deployment-specific environment validation.
- Documented PostgreSQL and Redis requirements.
- Migration command and upgrade notes.
- Backup/restore documentation.
- Health checks and logs.
- Explicit operator access model.
- Optional external managed payment provider configuration.

Keep deployment configuration separate from domain logic. Avoid branching core billing behavior based on hosting mode.

---

# 17. MVP delivery definition

Brightloop MVP is complete only when a tenant can:

1. Register and create an organization.
2. Invite a user and assign a tenant role.
3. Create a customer.
4. Create a product and recurring price.
5. Create a subscription for that customer.
6. Generate an invoice for the correct billing period.
7. Finalize the invoice immutably.
8. Initiate a payment through the selected gateway sandbox.
9. Receive and verify the provider webhook.
10. Record the payment exactly once.
11. View subscription, invoice and payment status.
12. Run the same billing/webhook job again without duplicate financial effects.
13. Demonstrate that another tenant cannot access any of the above records.

The MVP must also have a documented backup/restore procedure, audit history and basic operational monitoring.

---

# 18. Deferred scope and future releases

## Release 1.1
- Advanced discounts and coupons.
- More detailed tax configuration.
- More extensive credit-note workflows.
- Customer self-service portal improvements.
- Email template management.

## Release 1.2
- Stripe integration and international payment methods.
- More currencies and provider-specific payment flows.
- Advanced usage aggregation.
- Tiered and volume pricing.
- Dunning configuration and recovery analytics.

## Release 2
- Accounting-grade double-entry ledger.
- Advanced revenue recognition.
- Multi-entity organizations.
- Enterprise approval workflows.
- Advanced analytics and exports.
- Additional gateway and accounting integrations.

---

# 19. Final engineering decisions

The following decisions are considered locked for the MVP unless an Architecture Decision Record (ADR) explicitly changes them:

1. Modular monolith.
2. Next.js frontend and NestJS backend.
3. PostgreSQL as the source of truth.
4. Prisma for standard data access and reviewed SQL migrations for RLS, triggers and specialized constraints.
5. Redis/BullMQ for asynchronous work.
6. Verified tenant membership plus RLS for tenant isolation.
7. Decimal-safe financial calculations.
8. Immutable finalized invoices and credit-note corrections.
9. Database-backed idempotency and durable webhook inbox.
10. Transactional outbox for reliable post-commit processing.
11. One real payment provider in the MVP, behind a provider-neutral adapter.
12. Fixed recurring billing first; usage/hybrid foundations included, advanced pricing deferred.
13. Hosted and self-hosted deployment configurations.
14. India and international market support through explicit jurisdiction and currency models, not assumptions or hardcoded tax shortcuts.

---

# 20. Immediate next actions

Implement in this exact order:

1. Create the monorepo and local infrastructure.
2. Finalize the Prisma schema and SQL migration strategy.
3. Build the tenant-aware database access layer.
4. Apply RLS to every tenant-owned table.
5. Add composite tenant-aware foreign keys.
6. Write and pass tenant-isolation integration tests.
7. Implement authentication and tenant membership.
8. Continue to catalog, pricing and the billing lifecycle.

**Do not begin invoice automation or live payment processing until tenant isolation and the financial data model have passed their release gates.**

This revised plan is the implementation baseline for Brightloop MVP. Any future change to tenant boundaries, invoice immutability, payment state transitions or financial calculations must be documented and tested before implementation.
