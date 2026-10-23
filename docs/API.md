# API

Base path: `/api`. All bodies are JSON (limit 100 kb). Auth is a JWT in the HttpOnly cookie `crm_token`; clients must send credentials (`fetch(..., { credentials: 'include' })`).

## Response shape

```json
{ "success": true, "data": {}, "message": "Lead created" }
{ "success": false, "message": "Validation failed", "errors": [{ "field": "email", "message": "Invalid email" }] }
```

| Status | Meaning |
| ------ | ------- |
| 400 | Validation failed (`errors[]` populated) or malformed id |
| 401 | Not authenticated / invalid or expired session / invalid credentials |
| 403 | Authenticated but not allowed |
| 404 | Resource not found (or not visible to the caller) |
| 409 | Conflict (duplicate email) |
| 429 | Too many login attempts |
| 500 | Unexpected error (message is generic in production) |

## Routes

| Method | Route | Access | Purpose |
| ------ | ----- | ------ | ------- |
| GET    | `/api/health` | Public | Liveness + DB state |
| POST   | `/api/auth/login` | Public (rate limited) | `{ email, password }` → sets cookie, returns `{ user }` |
| POST   | `/api/auth/logout` | Public | Clears cookie |
| GET    | `/api/auth/me` | Authenticated | Current user |
| GET    | `/api/leads` | Authenticated | List (role-scoped) |
| POST   | `/api/leads` | Authenticated | Create lead |
| GET    | `/api/leads/:id` | Admin or assignee | Get lead |
| PATCH  | `/api/leads/:id` | Admin or assignee | Partial update |
| DELETE | `/api/leads/:id` | Admin | Delete lead |
| GET    | `/api/dashboard/stats` | Authenticated | Role-scoped KPIs + recent leads |
| GET    | `/api/users` | Admin | List users |
| GET    | `/api/users/assignable` | Authenticated | Active users `{ _id, name, role }` for assignee pickers |
| POST   | `/api/users` | Admin | Create user `{ name, email, password, role }` |
| PATCH  | `/api/users/:id/status` | Admin | `{ isActive }`; Admin cannot deactivate self |

Login failures always return `401 "Invalid email or password"` — the same message for unknown email, wrong password, and inactive account. A deactivated user's existing session is rejected on the next request.

## Lead list query

`GET /api/leads?search=acme&status=qualified&priority=high&assignedTo=USER_ID&page=1&limit=10&sort=-createdAt`

| Param | Rules |
| ----- | ----- |
| search | string ≤ 100, escaped regex on name/email/company |
| status, priority, source | enum values |
| assignedTo | ObjectId; ignored for Sales (always self) |
| page | int ≥ 1, default 1 |
| limit | int 1–100, default 10 |
| sort | one of `createdAt, updatedAt, name, company, status, priority, estimatedValue`, optional `-` prefix; default `-createdAt` |

Unknown query keys are rejected (400) so operators such as `status[$ne]=x` cannot reach Mongo.

Response `data`:

```json
{ "items": [Lead], "page": 1, "limit": 10, "total": 32, "totalPages": 4 }
```

`items[].assignedTo` and `createdBy` are populated as `{ _id, name, email }`.

## Dashboard stats

```json
{ "totals": { "total": 32, "new": 7, "contacted": 6, "qualified": 8, "won": 6, "lost": 5 }, "pipelineValue": 412000, "wonValue": 153000, "recentLeads": [Lead x5] }
```

`pipelineValue` sums `estimatedValue` for open statuses (new, contacted, qualified); `wonValue` sums won leads. Sales users only see their own leads in every number.

## Users

`GET /api/users` returns `{ users: [User & { leadCount }] }`. `POST /api/users` validates name (2–100), email, password (8–128), role; duplicate email → 409.

