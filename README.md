# Brightloop Subscription Management System

> **Version:** 2.0 — Revised Architecture  
> **Architecture:** Multi-tenant SaaS, PostgreSQL, NestJS, Prisma, Next.js, Redis/BullMQ  
> **Guarantees:** Hard Tenant Isolation (PostgreSQL RLS), Invoice Immutability, Exact Decimal Arithmetic, Idempotent Payments.

---

## 1. System Invariants & Core Architecture

1. **PostgreSQL is the source of truth** for tenants, subscriptions, invoices, payments, usage records and financial state.
2. **Hard Row-Level Security (RLS)**: Every tenant-owned table is protected by PostgreSQL RLS with `FORCE ROW LEVEL SECURITY`.
3. **Least-Privilege Database Runtime**: The API runtime connects as `brightloop_app` (`NOSUPERUSER`, `NOBYPASSRLS`), ensuring that RLS is enforced at the database kernel level.
4. **Transaction-Local Tenant Context**: Queries execute in transactions with `SELECT set_config('app.current_tenant', $1, true)`. Missing tenant context returns 0 rows.
5. **Exact Decimal Arithmetic**: All monetary calculations use `decimal.js` or integer minor units (paise/cents). Floating point arithmetic is forbidden.
6. **Immutable Finalized Invoices**: Once an invoice transitions to `finalized`, PostgreSQL database triggers abort any attempt to delete or alter its monetary lines or numbering. Corrections are issued strictly via credit notes.
7. **Idempotent Webhook Processing**: A durable webhook inbox stores events by unique provider event ID, rejecting or deduplicating replayed webhooks without duplicate financial effects.
8. **Outbox Pattern**: Domain events (`invoice.finalized`, `payment.succeeded`) are persisted in a transactional outbox table atomically with state changes.

---

## 2. Monorepo Structure

```text
brightloop/
├── apps/
│   ├── api/                     # NestJS Modular Monolith API
│   │   ├── src/
│   │   │   ├── common/          # Guards (JwtAuthGuard, TenantGuard), Decorators
│   │   │   ├── database/        # PrismaService (RLS app role), TenantContextService
│   │   │   └── modules/         # Auth, Tenants, Customers, Catalog, Subscriptions,
│   │   │                        # Invoices, Payments, Usage, Reporting
│   │   └── test/                # RLS Security Suite & E2E Lifecycle Suites
│   └── web/                     # Next.js 15 Admin Console & Billing Dashboard
├── packages/
│   ├── shared-types/            # Enums, Interfaces, DTO types
│   ├── financial-core/          # Decimal arithmetic, Minor units, Proration, MRR
│   └── validation/              # Zod schemas & Environment validation
├── prisma/
│   ├── schema.prisma            # Full relational schema with composite constraints
│   └── migrations/              # Reviewed SQL migrations (RLS policies, triggers, grants)
├── infra/
│   └── docker/
│       └── init-db.sql          # DB setup: creates brightloop_app role (NOSUPERUSER, NOBYPASSRLS)
├── docker-compose.yml           # PostgreSQL 16 & Redis 7 services
├── pnpm-workspace.yaml          # Monorepo workspaces
└── turbo.json                   # Build & test task orchestration
```

---

## 3. Quick Start & Local Setup

### Prerequisites
- Node.js >= 20 (Node 24 recommended)
- pnpm >= 9
- Docker Desktop or Docker Engine

### 1. Start Database & Queue Infrastructure
```bash
docker compose up -d
```
This initializes:
- PostgreSQL on port `5432` with databases `brightloop` and roles `postgres` (migration) and `brightloop_app` (runtime).
- Redis on port `6379`.

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Apply Database Migrations & RLS
```bash
pnpm exec prisma migrate deploy
pnpm exec prisma generate
```

### 4. Build Core Packages
```bash
pnpm --filter @brightloop/shared-types build
pnpm --filter @brightloop/financial-core build
pnpm --filter @brightloop/validation build
```

---

## 4. Test Suites & Verification

Brightloop includes automated release gate test suites:

### 1. Financial Core Unit Tests
Verifies decimal arithmetic, minor unit conversions (paise/cents/JPY), second-precise proration, and MRR normalization:
```bash
pnpm --filter @brightloop/financial-core test
```

### 2. Phase 1 Tenant Isolation & RLS Security Suite
Proves hard database kernel RLS isolation:
- Confirms runtime role is `brightloop_app` (`NOSUPERUSER`, `NOBYPASSRLS`).
- Confirms RLS and `FORCE ROW LEVEL SECURITY` on all tenant-owned tables.
- Confirms missing tenant context returns 0 rows.
- Confirms cross-tenant read/update/delete attempts fail.
- Confirms composite foreign key enforcement (`(tenantId, customerId)`).
- Confirms finalized invoice immutability trigger blocks updates and deletes.
```bash
pnpm --filter @brightloop/api test test/tenant-isolation.spec.ts
```

### 3. MVP End-to-End Lifecycle Verification (Section 17)
Executes the complete 13-step business workflow:
1. Organization registration & token generation.
2. User invitation & role assignment (`OWNER`, `FINANCE`).
3. Customer creation with GSTIN details.
4. Product & recurring price creation.
5. Subscription creation & period allocation.
6. Immutable finalized invoice generation.
7. Gateway sandbox order creation.
8. HMAC-SHA256 verified webhook processing.
9. Exactly-once payment recording.
10. Idempotent webhook retry handling.
11. Dashboard & MRR reporting reconciliation.
12. Cross-tenant rejection verification (404/403).
```bash
pnpm --filter @brightloop/api test test/e2e-billing-flow.spec.ts
```

### 4. Run All Monorepo Tests
```bash
pnpm -r test
```

---

## 5. Running the Application

### Start API Backend
```bash
pnpm --filter @brightloop/api dev
```
Listens on `http://localhost:4000/api`.
- Health liveness: `http://localhost:4000/api/health/liveness`
- Health readiness: `http://localhost:4000/api/health/readiness`

### Start Next.js Web Admin Console
```bash
pnpm --filter @brightloop/web dev
```
Open `http://localhost:3000` to interact with the Brightloop Admin & Billing Console.

---

## 6. Deployment Profiles

- **Hosted SaaS**: Run behind load balancers with SSL termination. Central PostgreSQL cluster enforces RLS per tenant. Redis BullMQ handles background dunning and recurring billing runs.
- **Self-Hosted / Deployable**: Docker Compose or Kubernetes deployment with isolated tenant instances. The platform operator cannot view tenant financial records without verified membership.
