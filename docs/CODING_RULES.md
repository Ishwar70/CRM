# Coding Rules

## General

- ES modules everywhere; Node 20+.
- One implementation path; no competing abstractions. Prefer small files with clear responsibility.
- No new dependencies without a clear reason. No UI component libraries; no chart libraries.
- Commit after each working vertical slice.

## Server (`server/src`)

- `config/` env + DB; `models/` Mongoose schemas; `validators/` Zod schemas; `services/` business + authorization logic; `controllers/` HTTP translation only; `routes/` wiring + middleware; `middleware/` auth, validation, errors; `utils/` helpers.
- Validate every body/query/param with Zod via `validate()` middleware; unknown keys are rejected (`.strict()`).
- Authorization lives in services/middleware (`requireAuth`, `requireRole`, ownership filters) — never only in the UI.
- Throw `ApiError(status, message, errors?)`; the central error handler formats responses. Wrap async handlers with `asyncHandler`.
- Responses always use `{ success, data, message }` / `{ success: false, message, errors }`.
- Never log passwords, tokens, or request bodies on auth routes.
- Escape user input before building regexes (`escapeRegex`).

## Client (`client/src`)

- `api/` fetch client + endpoint functions; `features/<domain>/` hooks, schemas, components for that domain; `components/` shared UI; `layouts/`; `pages/`; `routes/`; `utils/`.
- Server state via TanStack Query only (no duplicated global stores). Query keys: `['me']`, `['leads', params]`, `['lead', id]`, `['dashboard']`, `['users']`, `['assignable-users']`.
- Forms via React Hook Form + Zod schemas mirroring server rules.
- Tailwind utility classes; shared primitives in `components/ui`.
- Accessible by default: labels, focus-visible, keyboard support.

## Testing

- Server: Vitest + Supertest against `mongodb-memory-server`.
- Client: Vitest + React Testing Library + jsdom with mocked API module.
- Test the high-value behaviors (auth, authorization, validation, list metadata, key UI states), not implementation details.
