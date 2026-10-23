# Project: CRM Admin Dashboard

A compact MERN CRM for a freelancer portfolio. It proves full-stack delivery: authentication, role-based authorization, lead CRUD, server-side search/filter/sort/pagination, validation, error handling, and responsive UI.

Primary demo flow: **Login → Dashboard → Create Lead → Update → Search/Filter → Delete (Admin)**.

## Roles

| Role  | Allowed actions |
| ----- | --------------- |
| Admin | View all leads; create/edit/delete any lead; assign leads to any user; create/activate/deactivate users; view global dashboard totals. |
| Sales | View leads assigned to self; create leads (always auto-assigned to self); update own assigned leads; **cannot delete leads**; cannot manage users. |

## MVP

- Sign in with seeded Admin or Sales account; sign out clears the session.
- Dashboard KPI cards (Total, New, Qualified, Won) and recent leads, role-filtered.
- Leads list with debounced search, status/priority/assignee filters, sort, server-side pagination.
- Lead create, detail, edit; Admin-only delete with confirmation.
- Admin user management (list, create, activate/deactivate).
- Profile page with logout.
- Loading, empty, error (with retry), and success states throughout.

## Locked decisions

- Monorepo: `client/` (React + Vite + Tailwind) and `server/` (Express + Mongoose).
- JWT stored in an HttpOnly cookie (`Secure` + `SameSite=None` in production, `Lax` locally).
- Client data layer: TanStack Query; forms: React Hook Form + Zod.
- Delete policy: Admin only.
- Sales-created leads are auto-assigned to the creator; Admin may assign any active user.
- Search: escaped, case-insensitive regex over name/email/company (see trade-off in `DATA_MODEL.md`).

## Out of scope (v1)

Billing, subscriptions, email campaigns, chat, multi-tenant orgs, file uploads, calendar sync, AI features, heavy chart libraries, microservices.

## Definition of done

- [x] Admin and Sales can sign in and sign out.
- [x] Backend authorization is enforced and tested (not only hidden UI).
- [x] Lead CRUD persists in MongoDB.
- [x] Search, filters, sorting, and pagination work together.
- [x] Validation and error responses are consistent.
- [x] UI has loading, empty, error, and success states.
- [x] Mobile layout is usable (320 px).
- [x] High-value tests pass.
- [x] No secrets or real personal data committed.
- [ ] Public demo deployed (requires the owner's hosting accounts; see README).
- [x] Portfolio screenshots captured.
