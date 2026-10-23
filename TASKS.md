# Tasks

One checkbox per vertical slice. See `docs/` for contracts.

- [x] **Phase 0 — Contracts and baseline**: docs, client/server scaffold, env validation, Mongo connect, Helmet/CORS/rate-limit, central errors, `GET /api/health` + test.
- [x] **Phase 1 — Auth**: User model, seed, login/logout/me, `requireAuth`/`requireRole`, login page, protected routes, role-aware nav, logout.
- [x] **Phase 2 — Leads**: Lead model + indexes, role/ownership policy, CRUD + list query, leads list/form/detail UI.
- [ ] **Phase 3 — Dashboard + users**: stats endpoint, dashboard UI, Admin user management, profile.
- [ ] **Phase 4 — QA + portfolio**: high-value tests, demo seed (32 leads), README with deploy guide, screenshots, acceptance checklist.
- [ ] **Deploy** (owner): Atlas + Render/Railway + Vercel/Netlify — see README "Deployment".
