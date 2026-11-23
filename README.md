# Performance Management Platform

Next.js App Router frontend for the PMP API, with Arabic/English localization, RTL/LTR, Ant Design and TanStack Query.

## API integration
- Set `NEXT_PUBLIC_API_BASE_URL` to the API origin or versioned URL. The default is `http://89.117.49.160:8008`; `/api/v1` is appended automatically.
- Requests send `Accept: application/json`, locale-aware `Accept-Language`, and `Authorization: Bearer <token>` after sign-in.
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