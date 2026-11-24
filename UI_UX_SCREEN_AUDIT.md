# UI/UX Screen Audit

**Reference:** `UI_UX_DESIGN_GUIDELINES.md`  
**Business source:** `Performance_managment_platform_V1.2.pdf`  
**Audit date:** 2026-11-24  
**Current branch:** `main`

## 1. Shared table migration

The shared entry point is `src/components/ui/data-table.tsx`. It wraps Ant Design Table without removing the supported Table API. Shared visual tokens and responsive wrapper styles live in `src/app/globals.css`.

The legacy `AppTable` in `src/components/ui-antd-primitives.tsx` now delegates to `DataTable`, so older prototype screens using `AppTable` share the same table rendering path.

### Migrated feature files

- `src/features/api/manager-dashboard-workspace.tsx`
- `src/features/api/admin-dashboard-workspace.tsx`
- `src/features/api/admin-final-review-workspace.tsx`
- `src/features/api/employee-results-workspace.tsx`
- `src/features/api/employees-workspace.tsx`
- `src/features/api/manager-workspaces.tsx`
- `src/features/api/admin-configuration-workspaces.tsx`
- `src/features/api/plan-workspace.tsx`
- `src/features/api/performance-cycles/cycle-list.tsx`
- `src/features/api/performance-cycles/cycle-stages-table.tsx`
- `src/features/api/performance-cycles/cycle-progress-panel.tsx`
- `src/features/api/performance-cycles/cycle-scope-panel.tsx`
- `src/features/api/performance-cycles/cycle-eligibility-preview.tsx`
- `src/features/api/performance-cycles/cycle-not-included-panel.tsx`
- `src/features/api/performance-cycles/cycle-stage-editor.tsx`

Feature-specific classes may continue to control column layout and domain-specific density. They must not fork the shared header, text, border, surface, and hover system.

## 2. Role and route inventory

### Admin

- Dashboard, employee directory, performance cycles (list/create/detail/edit), plan review list/detail, final group approvals, objective categories, competency templates, performance configuration.
- Additional experiences: Bell Curve monitoring, performance history, notifications, notification templates, publication, and reports.
- API-backed screens use the shared DataTable where they render data tables.
- Prototype-oriented experiences still contain illustrative/mock data in areas such as reports, publication, history, and workflow demo screens. A visual refactor must not imply these records are live backend data.

### Manager

- Dashboard / Team Overview, My Team, employee detail, objectives, manager evaluation, year group, calculations, returned-plan reviews, team performance, history, and notifications.
- Manager Dashboard and API-backed team/group lists now use DataTable.
- Preserve Direct Report scope, active-cycle context, latest synchronized manager assignment, history, and workflow-authorized actions from BRD UC-009 / UC-010 and the related permission rules.

### Employee

- My Performance dashboard, objectives, plan detail/review, published performance results, development, history, and notifications.
- Employee results table uses DataTable.
- BRD UC-024 visibility is mandatory: show results only after publication; do not expose KPI Actual, Achievement %, Weighted KPI Result, Manager Comments, supporting Evidence, or restricted internal Manager/Admin history.

### HCD

- Overview, cycles, calibration, templates, reports, history, and notifications.
- Several overview/subpage experiences are currently presentation/demo-oriented and use illustrative content. Keep them visually aligned, but do not represent mock content as synchronized business data.

### Department

- Department overview, teams, progress, reports, history, and notifications.
- Current overview/subpage experiences are presentation/demo-oriented. Maintain department-scoped framing and do not imply organization-wide data access.

## 3. BRD guardrails for visual work

- Manager Dashboard Team Summary spans the Manager's applicable Direct Reports; cycle selection filters My Team; each employee record retains its applicable cycle and current status.
- Employee access is restricted to the employee's own records and published results.
- Admin and authorized Manager details may show evaluation information only within their permissions.
- Bell Curve views must preserve group context, min/max distribution rules, validation blockers, and the distinction between provisional and finalized values.
- UI actions must continue to use existing workflow logic and backend-provided permissions / allowed actions.
- Manager reassignment must show current ownership from the latest successful Jisr sync while preserving historical manager assignments and historical records.

## 4. Verification

Latest verified workflow run for the DataTable migration and CI workflow update:

- `npm install`: passed
- `npm run typecheck`: passed
- `npm test`: passed
- `npm run build`: passed
- `npm run lint`: failed on existing repository-wide lint debt (348 errors, 27 warnings in the run). The reported issues include explicit `any` usage and React Hooks lint violations; the shared DataTable component itself was not listed as a lint failure.
- Vercel production deployment for the workflow update: READY.

Browser DevTools Console and visual screenshots for every route have not been verified by this automated workflow. They require an authenticated browser pass in both locales and representative desktop/mobile widths.

## 5. Remaining manual review

1. Inspect all Admin, Manager, Employee, HCD, and Department routes in English and Arabic.
2. Verify every table variant: sort/filter, selection, expandable rows, fixed columns, pagination, empty/loading/error states, keyboard/focus, and narrow-screen overflow.
3. Inspect specialized Bell Curve, cycle stage, eligibility, and evaluation tables to ensure domain-specific structure remains clear while using shared visual tokens.
4. Resolve repository-wide lint errors without suppressing rules or changing business logic.
5. Perform authenticated browser Console review and capture desktop/mobile screenshots.
6. If converting `globals.css` to SCSS, add Sass as a real dependency and commit a lockfile generated by npm; do not rename files without the dependency/lockfile update.

## 6. Access and BRD alignment blockers identified during continued review

- `AppShell` currently treats only `admin`, `manager`, and `employee` as API roles. The `department` and `hcd` role values are rejected by its authorization guard and redirected to the user's home route. Their pages exist, but the current client role model (`ApiRoleFlags`) exposes only three role flags. Do not bypass this guard or infer access from the route name. Backend identity/permission contracts must expose the Department Manager and HCD roles/scopes before those workspaces can be treated as operational.
- The BRD PDF and the available DOCX copy differ on HCD result visibility: the PDF describes organization-wide visibility regardless of reporting line/department/hierarchy, while the DOCX excerpt describes visibility within the authorized organizational scope. This is a requirements discrepancy to resolve with the product owner; the UI must not decide which interpretation wins.
- The Department Manager scope is explicitly limited to Employees within the authorized Department scope in the BRD results visibility section. Any department tables and filters must receive this scope from backend authorization, not from client-side filtering alone.
- Employee results remain strictly limited to the employee's own results and must hide individual KPI Actuals, Achievement %, Weighted KPI Results, Manager Comments, and Evidence. Final annual results are shown only after publication; finalized/published results are read-only.
- The manager dashboard stylesheet no longer redefines shared table headers, cell padding, hover, or pagination. Draft-row highlighting remains as a domain-specific status treatment; all base table styling comes from the shared DataTable baseline.

## 7. Current follow-up status

- The Manager Dashboard's custom table CSS was narrowed to preserve only layout and draft-row status treatment; shared DataTable styles now own its table header, cell rhythm, hover, and pagination.
- Removed several unused imports/variables and refactored three React state effects to derive UI state instead of synchronously setting state inside effects.
- A fresh CI run is required to confirm these latest lint cleanups. The previous confirmed quality run still had Lint failures; typecheck, tests, and production build passed.
- Browser console and authenticated role-based route verification remain outstanding.
