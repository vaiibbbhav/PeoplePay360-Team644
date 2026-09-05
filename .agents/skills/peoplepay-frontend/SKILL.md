---
name: peoplepay-frontend
description: Feature-driven frontend conventions for PeoplePay360. Covers feature layout, colocated queries (types + API + React Query), direct imports, and type usage.
---

# PeoplePay360 Frontend Architecture Skill

## 1. Feature-Driven Anatomy
All business domains live in `frontend/src/features/<feature>/`:
```
features/<feature-name>/
├── components/          # Feature-scoped UI components
├── pages/               # Routable screen views
└── queries/             # Colocated API calls + React Query hooks + types
```

## 2. Simplicity, Straightforward Logic & Modularity Mandate

- **Keep UI & Logic Extremely Simple:** Write declarative, easy-to-follow React code. Avoid over-complicated custom hook cascades, unnecessary Context providers, or convoluted state reducers when simple React `useState` / React Query suffices.
- **Structured & Modular Components:**
  - Split large views (> 200 lines) into small, focused sub-components in `components/` (e.g., `UserTable.tsx`, `UserFormPanel.tsx`).
  - Keep each component's responsibility strictly focused on its visual piece and immediate user interactions.
- **Straightforward Data Flow:**
  - Query hooks in `queries/` fetch or mutate data with direct, predictable response types.
  - Components consume hooks directly, rendering Loading, Error, and Content states cleanly.
  - Pass callbacks cleanly between parent layouts and child panels.

## 3. Mandatory Rules

1. **Colocated Queries & Types:**
   - Put request/response `type` declarations, private Axios fetch functions, and exported React Query hooks (`useQuery` / `useMutation`) in the same file inside `queries/`.
   - **Do NOT** create separate `types.ts` or `services/` files inside features.
2. **No Barrel Files:**
   - Do NOT create `index.ts` barrel files. Use direct imports from components, pages, or query files.
3. **Use `type` over `interface`:**
   - Enforce `type` across all component props, payload schemas, and query returns.
4. **Global Layer:**
   - Global network client lives in `@/api/apiClient` (Axios with credentials and 401 refresh queue).
   - Generic presentational primitives live in `@/components/ui/`.
   - Data fetching is strictly done inside `queries/` hooks — never call Axios directly inside a component.
5. **Strict Tailwind CSS Standard:**
   - ALWAYS style components using Tailwind CSS utility classes (`className="..."`).
   - NEVER use vanilla CSS or inline `style={{ ... }}` unless an extreme dynamic runtime calculation strictly requires it.
6. **Suspense & Error Boundary Standard:**
   - Prefer React `<Suspense fallback={...}>` and declarative `<ErrorBoundary fallback={...}>` over repetitive `if (isLoading) return ...; if (isError) return ...;` boilerplate in top-level pages.
   - Colocate suspense queries with `useSuspenseQuery` in the feature's `queries/` file for seamless streaming/suspension.
   - Generic boundary primitive lives in `@/components/ui/ErrorBoundary`.


