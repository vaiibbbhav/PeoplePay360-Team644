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

## 2. Simplicity, Straightforward Logic & Modularity Mandate

- **Keep Logic Extremely Simple:** Do not create bloated helper wrappers, overly complex class hierarchies, or convoluted abstractions.
- **Straightforward Linear Flow:** Each service function must read top-to-bottom in plain, logical steps:
  1. Validate prerequisites (throw specific `ValidationError`, `NotFoundError`, etc.)
  2. Execute core logic or calculations
  3. Persist state via repository
  4. Return straightforward typed data
- **Structure & Modularity:**
  - Keep modules strictly self-contained within `src/modules/<module-name>/`.
  - Extract reusable calculation logic into dedicated, clean utility functions.
  - Keep functions focused: one function per distinct business operation.
  - Keep repository queries simple and direct without overly nested subqueries where simple joins or separate indexed lookups suffice.

## 3. Mandatory Rules

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
