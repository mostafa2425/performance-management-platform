# Performance Management Platform

Frontend prototype for an enterprise employee performance management platform.

## Stack
- Next.js App Router + TypeScript
- Ant Design v6
- Tailwind CSS v4
- TanStack Query v5
- Lucide icons
- Arabic / English (RTL / LTR)
- PWA foundation

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. The root route redirects to `/en`.

## Demo experience

- Sign in: `/en/login` or `/ar/login`
- Dashboard: `/en/dashboard`
- My objectives: `/en/employee/objectives`
- My performance: `/en/employee/performance`
- Development: `/en/employee/development`

The login is currently a frontend-only demo. Use any valid email and a non-empty password, or choose Continue with Microsoft, to open the mock dashboard. No real authentication is performed.

## Mock data

Employee, objectives, competencies, action items and progress values are in:
`src/features/dashboard/mock-data.ts`.

Replace the mock data access with feature API hooks when the backend OpenAPI contract is available. Keep authorization, workflow transitions, calculations, Bell Curve rules and publication decisions on the backend.

## Documentation
- [Frontend Technical Specification](docs/FRONTEND_TECHNICAL_SPECIFICATION.md)

## Project principles
- Backend is the source of truth for authorization, workflow transitions, calculations, Bell Curve rules, and publication.
- No sensitive employee performance data is cached for offline use.
- User-facing strings must support both locales.
- Keep feature code inside `src/features`; shared UI belongs in `src/components`.

## Status
Frontend prototype and mock employee experience are in progress. API contracts and business-rule clarifications are tracked in the technical specification.
