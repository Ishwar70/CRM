# QA and Acceptance

## Automated tests

| Suite | Command | Count | Covers |
| ----- | ------- | ----- | ------ |
| Server (Vitest + Supertest + mongodb-memory-server) | `npm --prefix server test` | 48 | health/404/malformed JSON, env validation; login success / wrong password / unknown email / inactive user / operator injection; `/me` unauthenticated, tampered, deactivated; logout; lead create/assign/auto-assign, validation (missing name, invalid enum, negative value, bad email, long notes, unknown fields); Sales isolation (404 on others' leads, 403 reassign/delete); Admin delete; list search + status + assignee + pagination + sort metadata, escaped regex, rejected operators; users admin-only, create/duplicate/deactivate/self-guard; dashboard role scoping |
| Client (Vitest + React Testing Library + jsdom) | `npm --prefix client test` | 19 | API client; login validation, invalid credentials, demo sign-in; protected-route redirect; API-unreachable retry; leads empty / error+retry / debounced search+filter params; create-lead validation, submission and server field errors; Sales blocked from `/users`; dashboard KPIs and error state |
| Browser smoke (Playwright + Chrome) | `cd e2e && npm i && npm run smoke` | 43 checks | Full Admin and Sales flows against the running app (below); also regenerates `docs/screenshots/` |

Lint: `npm run lint` (ESLint 9, server + client).

## Manual acceptance checklist (blueprint §10)

Executed against a fresh in-memory seed (32 leads, 3 users) in Chrome via `e2e/smoke.mjs`.

| Check | Result |
| ----- | ------ |
| Login as Admin and Sales in separate browser sessions | Pass (separate contexts) |
| Role-specific navigation (Users link only for Admin) | Pass |
| Dashboard counts: Admin 32 total, Sales 13 (own only) | Pass |
| Create lead (validation shown for empty name, invalid email) | Pass |
| Edit lead (status + value persist) | Pass |
| Search ("solar" → 1), status filter, status + assignee combined, sort, reset | Pass |
| Pagination (page 2 of 4, URL-synced) | Pass |
| Admin delete with confirm dialog (focus on Cancel), lead then 404s | Pass |
| Sales: no Delete button; created lead auto-assigned to self; can edit own lead | Pass |
| Direct `/users` URL as Sales redirects to dashboard with notice | Pass |
| Backend request for another user's lead as Sales: GET/PATCH 404, DELETE 403, `/api/users` 403 | Pass |
| Refresh protected page restores session | Pass |
| Logout, then protected route redirects to login | Pass |
| 320 px and 390 px width: card layout, no horizontal overflow, collapsible filters, nav drawer | Pass |
| Backend stopped: "Unable to reach the CRM — server unavailable" with Try again | Pass (manual) |
| Browser console: no errors besides expected 4xx network logs | Pass (0 unexpected) |
| Server logs: no unexpected errors | Pass |
| Repository has no `.env`, keys, or real personal data (`.example` domains only) | Pass |
