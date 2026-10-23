# Data Model

## User

| Field        | Type     | Rules |
| ------------ | -------- | ----- |
| name         | String   | required, 2–100 chars, trimmed |
| email        | String   | required, unique, lowercase, trimmed |
| passwordHash | String   | required, bcrypt (cost 10), `select: false` |
| role         | String   | `admin` \| `sales`, default `sales` |
| isActive     | Boolean  | default `true` |
| createdAt / updatedAt | Date | timestamps |

`passwordHash` is never returned by the API (`toJSON` strips it and it is excluded from queries by default).

## Lead

| Field          | Type     | Rules |
| -------------- | -------- | ----- |
| name           | String   | required, 2–100 chars |
| email          | String   | optional, valid email, lowercase |
| phone          | String   | optional, max 30 chars, stored as text |
| company        | String   | optional, max 120 |
| source         | String   | `website` \| `referral` \| `linkedin` \| `other`, default `other` |
| status         | String   | `new` \| `contacted` \| `qualified` \| `won` \| `lost`, default `new` |
| priority       | String   | `low` \| `medium` \| `high`, default `medium` |
| estimatedValue | Number   | optional, min 0 |
| notes          | String   | optional, max 2000 |
| assignedTo     | ObjectId | ref User, required |
| createdBy      | ObjectId | ref User, required |
| createdAt / updatedAt | Date | timestamps |

## Indexes

- `User.email` unique.
- `Lead.status`, `Lead.assignedTo`, `Lead.createdAt` (single-field).

## Ownership rules

- Admin: every lead.
- Sales: only leads where `assignedTo == self`. Requests for any other lead return **404** (the API does not reveal that the lead exists). Updates that try to change `assignedTo` are rejected with **403**.
- Sales-created leads: `assignedTo` is forced to the creator, regardless of request body.
- Delete: Admin only (403 for Sales).
- Admin can only assign leads to existing **active** users.

## Search trade-off

Search uses a case-insensitive regex across `name`, `email`, and `company`, with user input escaped (`escapeRegex`) so characters like `.*(` are literal and cannot cause ReDoS or operator injection. This is fine for demo-sized data (tens to thousands of rows) but cannot use an index for non-prefix matches. For larger datasets, switch to a MongoDB text index (`{ name: 'text', email: 'text', company: 'text' }`) or Atlas Search, accepting word-based (not substring) matching.
