---
name: neon-drizzle-practices
description: Database practices for Neon Serverless Postgres and Drizzle ORM in PeoplePay360.
---

# Neon DB + Drizzle ORM Practices

## 1. Connection Architecture
- Single pool configuration in `backend/src/shared/db.ts` utilizing `pg` Pool and `drizzle-orm/node-postgres`.
- SSL configured with `rejectUnauthorized: false` for `neon.tech` connection strings.
- Never establish independent connection instances in individual modules.

## 2. Schema Conventions
- All tables defined in `backend/src/db/schema.ts`.
- UUID primary keys with `defaultRandom()`.
- Explicit foreign keys with appropriate cascade policies (`cascade`, `restrict`, or `set null`).
- Exact numerical precision for financial calculations:
  - Wages and salary rule amounts: `numeric({ precision: 12, scale: 2 })`.
  - Payrun aggregates: `numeric({ precision: 14, scale: 2 })`.
  - Worked days & hours: `numeric({ precision: 5, scale: 2 })`.

## 3. Schema Sync Mandate
Whenever any developer or agent modifies, adds, or drops a table or column in `src/db/schema.ts`, you **MUST** update `DATABASE_SCHEMA.md` in the exact same change.
