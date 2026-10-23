# UI

React + Vite + Tailwind. Layout: left sidebar (desktop) / top bar with menu toggle (mobile < 768 px). Minimum supported width: 320 px.

## Pages

| Route | Access | Contents |
| ----- | ------ | -------- |
| `/login` | Public | Email, password, Zod validation, demo-account hints (click to fill), generic error. Redirects to `/dashboard` if already signed in. |
| `/dashboard` | Authenticated | 4 KPI cards (Total, New, Qualified, Won), status distribution bars (CSS only), recent leads table. |
| `/leads` | Authenticated | Search (300 ms debounce), status/priority filters, assignee filter (Admin), sort, reset, result count, pagination; desktop table, mobile cards; "New lead" action. |
| `/leads/new` | Authenticated | Lead form. Assignee select for Admin; Sales sees "Assigned to you". |
| `/leads/:id` | Admin or assignee | Detail view, Edit toggle (same form), Delete (Admin) with confirm dialog. |
| `/users` | Admin | User table, create-user form, activate/deactivate toggle. Sales is redirected to `/dashboard` with a "no access" notice. |
| `/profile` | Authenticated | Name, email, role, status, logout. |

Unknown routes render a 404 page.

## States

Every data view has:

- **Loading**: skeleton rows/cards.
- **Empty**: friendly message plus a primary action where relevant (e.g. "Create lead", "Reset filters").
- **Error**: message plus "Try again" button calling `refetch()`.
- **Success**: toast notifications for create/update/delete/user changes.

## Components

`Button`, `Input`/`Select`/`Textarea` fields with linked labels and errors (`aria-describedby`, `aria-invalid`), `StatusBadge` / `PriorityBadge` (text + color), `Skeleton`, `EmptyState`, `ErrorState`, `ConfirmDialog` (focus-trapped, Esc to close), `Pagination`, `Toast` provider.

## Accessibility

- Every input has a visible `<label>`; errors are linked via `aria-describedby`.
- Keyboard-only usable; visible focus ring (`focus-visible:ring`).
- Dialogs move focus in, trap Tab, restore focus on close.
- Statuses always include a text label; color is supplementary.
- Tables use `<th scope="col">`.
