# Performance Management Platform

Next.js App Router frontend for the PMP API, with Arabic/English localization, RTL/LTR, Ant Design and TanStack Query.

## API integration
- Set the server-only `PMP_API_ORIGIN` environment variable to the backend origin (default: `http://89.117.49.160:8008`). The Next.js same-origin proxy appends `/api/v1`, avoiding browser mixed-content and CORS issues when the frontend is served over HTTPS.
- The browser calls `/api/pmp/*`; `src/app/api/pmp/[...path]/route.ts` proxies requests server-side to the backend. Requests forward `Accept: application/json`, locale-aware `Accept-Language`, `Authorization: Bearer <token>`, and multipart boundaries for evidence uploads.
- Email/password sign-in calls `POST /api/v1/auth/login`; the bearer token is held in `sessionStorage` and expires according to the API `expires_at` value. The session is restored through `GET /me` and revoked with `POST /auth/logout`.
- API errors preserve the backend error code, translated message, field validation errors, details and request id. HTTP 401 clears the session and redirects to login.
- TanStack Query hooks and feature API services live in `src/lib/api`; API-backed cycle, plan, evaluation, notification-template, final-review and results workspaces live in `src/features/api`.
- Evidence uploads use multipart form data; downloads use an authenticated blob request.

## Local development
```bash
cp .env.example .env.local
npm install
npm run dev
```

## Important
- The API guide is authoritative for endpoint contracts, response envelopes, workflow actions, role scope, version conflicts, and server-side deadlines.
- The backend is the source of truth for permissions, workflow transitions, eligibility, scores, Bell Curve rules and publication.
- No sensitive performance data is cached offline. Microsoft SSO is not part of the currently supplied API contract and remains disabled until the backend supplies its flow.
- Do not commit `.env.local`, credentials, tokens or real employee data.