# Backend Architecture & Conventions
**PeoplePay360 Node.js + Express + Drizzle ORM Backend**

---

## 1. Modular 4-Layer Architecture

Every business domain inside `backend/src/modules/<module-name>/` strictly implements 4 distinct layers:

```
routes ──► controllers ──► services ──► repositories ──► db (shared Neon)
```

Never skip a layer. Never call repositories from controllers. Never import Express `Request` / `Response` in services or repositories.

### Module Anatomy
```
src/modules/<module-name>/
├── <module>.routes.ts        # Express Router definitions (Path + HTTP Verb → Controller)
├── <module>.controller.ts    # Request parsing (Zod), status code setting, response formatting
├── <module>.service.ts       # Domain logic, mathematical formulas, state machine validations
├── <module>.repository.ts    # Drizzle ORM queries using shared db client
└── <module>.validators.ts    # Zod schemas for input validation
```

---

## 2. Layer Responsibilities & Rules

### A. Routes (`<module>.routes.ts`)
- Defines Express `Router()` instances.
- **Rule:** Contains zero logic, zero validation, and zero response handlers. It only maps the path and HTTP method to the controller handler and attaches auth/permission middleware.
- **Example:**
  ```typescript
  import { Router } from 'express';
  import * as attendanceController from './attendance.controller';
  import { authenticateToken, requirePermission } from '../../shared/auth-middleware';

  const router = Router();

  router.get('/', authenticateToken, attendanceController.listAttendance);
  router.get('/:id', authenticateToken, attendanceController.getAttendanceById);
  router.post('/check-in', authenticateToken, attendanceController.recordCheckIn);
  router.post('/check-out', authenticateToken, attendanceController.recordCheckOut);
  router.post('/manual', authenticateToken, requirePermission('attendance.write'), attendanceController.saveManualAttendance);

  export default router;
  ```

### B. Controllers (`<module>.controller.ts`)
- Wraps handlers using `asyncHandler`.
- Parses and validates inputs from `req.body`, `req.params`, or `req.query` using Zod schemas from `<module>.validators.ts`.
- Invokes exactly **one** service method.
- Sends the HTTP response with appropriate status code (`200`, `201`, `204`).
- **Example:**
  ```typescript
  import { Request, Response } from 'express';
  import { asyncHandler } from '../../shared/async-handler';
  import { checkInSchema } from './attendance.validators';
  import * as attendanceService from './attendance.service';

  export const recordCheckIn = asyncHandler(async (req: Request, res: Response) => {
    const { employeeId, checkIn } = checkInSchema.parse(req.body);
    const record = await attendanceService.recordCheckIn(employeeId, checkIn);
    res.status(201).json(record);
  });
  ```

### C. Services (`<module>.service.ts`)
- Pure business logic, computations, validations, and domain rules.
- **Rule:** Must never import `Request`, `Response`, or `NextFunction`. Services must be fully testable without mocking HTTP objects.
- Throws typed errors from `src/shared/errors.ts` (`BadRequestError`, `NotFoundError`, `ConflictError`, `UnauthorizedError`, `ForbiddenError`).
- May orchestrate calls to multiple repositories.

### D. Repositories (`<module>.repository.ts`)
- Performs atomic database reads and writes using Drizzle ORM.
- Imports the singleton `db` client from `@/shared/db`.
- No business logic, no status code manipulation.

---

## 3. Strict Coding Conventions

### A. Use `type` Over `interface`
> [!IMPORTANT]
> **Always use `type` instead of `interface`** across all TypeScript declarations. Only use `interface` if an explicit third-party library or declaration merging scenario strictly requires it.

```typescript
// ✅ CORRECT:
export type AttendanceFilter = {
  employeeId?: string;
  startDate?: string;
  endDate?: string;
};

// ❌ INCORRECT:
export interface AttendanceFilter {
  employeeId?: string;
}
```

### B. Database & Schema Synchronization
- The database is centralized: `src/db/schema.ts` defines all tables, and `src/shared/db.ts` establishes the Neon connection pool. Modules **do not** have their own database connection files.
- **Rule:** Whenever a model, field, or relation is updated in `src/db/schema.ts`, you **must update `DATABASE_SCHEMA.md`** in the same change.

### C. Error Handling
- Never use silent `try/catch` blocks.
- Let errors bubble up to the centralized error middleware in `src/app.ts`.
- Handlers in controllers are wrapped with `asyncHandler` to pass unhandled rejections to Express.

### D. No Background Daemons / Cron
- No `node-cron` or persistent worker processes. Batch payroll calculations and period-based attendance scans are triggered through authorized HTTP actions (e.g. `POST /api/payroll/payruns/:id/compute`).
