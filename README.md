# Performance Management Platform

Enterprise employee performance management frontend.

## Stack
- Next.js App Router + TypeScript
- Ant Design v6
- Tailwind CSS
- TanStack Query v5
- Arabic / English (RTL / LTR)
- PWA foundation

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

## Documentation
- [Frontend Technical Specification](docs/FRONTEND_TECHNICAL_SPECIFICATION.md)

## Project principles
- Backend is the source of truth for authorization, workflow transitions, calculations, Bell Curve rules, and publication.
- No sensitive employee performance data is cached for offline use.
- User-facing strings must be localized.
- Keep feature code inside `src/features`; shared UI belongs in `src/components`.

## Status
Repository foundation in progress. API contracts and business-rule clarifications are tracked in the technical specification.
