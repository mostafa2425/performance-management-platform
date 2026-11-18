# Feature modules

Create one folder per business capability (for example `performance-cycles`,
`objectives`, `evaluations`, `bell-curve`, and `results`).

Recommended feature structure:
- `api/` — typed API functions
- `components/` — feature-specific UI
- `hooks/` — TanStack Query hooks
- `schemas/` — Zod validation schemas
- `types/` — feature types
- `utils/` — presentation-only helpers

Keep business calculations and authorization decisions on the backend.