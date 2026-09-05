# PeoplePay360 GitHub Copilot Instructions

- Backend strictly follows 4 layers: `routes` -> `controllers` -> `services` -> `repositories` -> `db`.
- Routes `<module>.routes.ts` contain only path and controller bindings.
- Controllers `<module>.controller.ts` parse with Zod and call services inside `asyncHandler`.
- Services `<module>.service.ts` contain pure business logic with no Express imports.
- Repositories `<module>.repository.ts` run Drizzle queries on shared `db`.
- Frontend features in `src/features/<feature>/` contain `components/`, `pages/`, `queries/`.
- Queries are colocated with types and React Query hooks in `queries/`.
- Never use `interface`, always use `type`.
- If modifying `backend/src/db/schema.ts`, always update `DATABASE_SCHEMA.md`.
- Adhere to `DESIGN.md`: Playfair Display headlines, IBM Plex Sans body, violet accent `#6A3FA0`, hairline borders.
