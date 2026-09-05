# PeoplePay360: Agent Conventions & Architectural Rules

These are non-negotiable structural rules. Follow them exactly when reading or writing code in this repository.

---

## 1. Backend Architecture (Node + Express + Drizzle ORM)

Strict 4-layer one-directional dependency chain:
```
routes ──► controllers ──► services ──► repositories ──► db (Neon Postgres)
```

- **Routes (`<module>.routes.ts`):** Only maps HTTP method + path to controller functions and attaches middleware (`authenticateToken`, `requirePermission`). **No validation, no business logic, no response shaping.**
- **Controllers (`<module>.controller.ts`):** Parses/validates input with Zod, invokes **ONE** service method, sets HTTP status code, and responds. Handlers wrapped in `asyncHandler`.
- **Services (`<module>.service.ts`):** ALL business logic. Pure functions with zero knowledge of Express `req`/`res`.
- **Repositories (`<module>.repository.ts`):** Drizzle ORM queries using the central singleton `db` from `@/shared/db`. No business logic.
- **Central Database:** Single connection in `src/shared/db.ts` and single schema in `src/db/schema.ts`. **No local DB files in modules.**
- **No Background Workers:** No `node-cron` or daemon tasks.

> [!IMPORTANT]
> **DATABASE_SCHEMA.MD SYNCHRONIZATION MANDATE:**
> Whenever you add, update, or remove any table or column in `src/db/schema.ts`, you **MUST** update `DATABASE_SCHEMA.md` in the exact same task.

---

## 2. Frontend Architecture (React + Vite + Tailwind CSS)

Feature-driven modular architecture under `src/features/<feature>/`:
```
features/<feature-name>/
├── components/          # Feature-scoped UI components
├── pages/               # Routable page screens
└── queries/             # Colocated API calls + React Query hooks + types
```

- **Colocated Queries:** In `queries/`, the API call and the React Query hook (`useQuery`/`useMutation`) live in the same file.
- **No `types.ts`:** Domain types are declared directly in their corresponding query file.
- **No Barrel Files:** Direct imports across features are standard.
- **Global Layer:** `src/api/apiClient.ts` (Axios with 401 refresh queue), `src/components/ui/` (generic UI primitives), `src/lib/` (utilities).

---

## 3. Simplicity, Straightforward Logic & Modularity Mandate

1. **Extreme Simplicity:** Always write simple, clean, and directly readable code. Avoid over-engineering, speculative abstractions, wrappers around wrappers, and unnecessary cognitive load.
2. **Straightforward Logic:** Business logic must follow linear, predictable step-by-step flow without convoluted nesting or clever hacks.
3. **Clean Structure & Modularity:**
   - Break large files or components into smaller, single-responsibility modules.
   - Keep functions focused: each function should do one thing well.
   - Keep files well-organized with clear section headers and logical flow.

---

## 4. Strict Coding Conventions

1. **Always use `type` instead of `interface`** across both backend and frontend, unless strictly required for external library declaration merging.
2. **Design System:** Strictly adhere to `DESIGN.md` (Playfair Display headlines, IBM Plex Sans body, violet accent `#6A3FA0`, hairline borders, zero shadows/gradients).
3. **Explicit UI States (Suspense & Error Boundary):** Handle **Loading** and **Error** states via `<Suspense fallback={...}>` and `<ErrorBoundary fallback={...}>` (from `@/components/ui/ErrorBoundary`) with `useSuspenseQuery`. Empty states must be handled cleanly within the component.
4. **Tailwind Standard:** Always use Tailwind CSS utility classes (`className="..."`), never inline styles (`style={{ ... }}`) or ad-hoc vanilla CSS.
