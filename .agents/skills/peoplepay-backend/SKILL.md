---
name: peoplepay-backend
description: Strict 4-layer modular backend conventions for PeoplePay360. Covers routes, controllers, services, repositories, Zod validation, error handling, type usage, and the mandatory DATABASE_SCHEMA.md update rule.
---

# PeoplePay360 Backend Architecture Skill

## 1. 4-Layer Dependency Chain
```
routes ──► controllers ──► services ──► repositories ──► db (shared Neon)
```

Never skip layers.
- `<module>.routes.ts`: Maps path + method to controller, binds auth/permission middleware. No request parsing or business logic.
- `<module>.controller.ts`: Wraps handlers in `asyncHandler`. Parses `req.body`/`req.query` with Zod from `<module>.validators.ts`. Calls ONE service method. Sends JSON response with status code.
- `<module>.service.ts`: Pure functions. All validation, state logic, and formula computation. Never imports `req`/`res`. Throws `AppError` subclasses.
- `<module>.repository.ts`: Drizzle queries using `db` from `@/shared/db`. No business logic.
- `<module>.validators.ts`: Zod schemas.

## 2. Mandatory Rules

1. **Use `type` over `interface`:**
   ```typescript
   export type AttendanceRecord = { ... }; // ✅
   export interface AttendanceRecord { ... } // ❌
   ```
2. **Schema Synchronization Rule:**
   Any change to `backend/src/db/schema.ts` **MUST** be accompanied by an update to `DATABASE_SCHEMA.md` in the same task.
3. **No Cron Daemons:**
   All batch calculations (payruns, attendance audits) are triggered through authorized HTTP actions.
4. **Centralized DB:**
   Single connection pool in `src/shared/db.ts`. Do NOT create database connection files in module directories.
