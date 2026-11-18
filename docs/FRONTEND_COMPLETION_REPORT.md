# Frontend Completion Report — Performance Management Platform

**Date:** 18 November 2026  
**Scope:** Frontend-only completion pass. No backend services, endpoints, or contracts were added.

## 1. Functional workflow work

### UC-011 — Manager objective and KPI planning
Route: `/[locale]/manager/objectives`

- Start from scratch, load an illustrative existing template, or copy a previous-period sample into an independent editable draft.
- Select employee and period.
- Create and remove objectives; assign one category per objective from the Admin-managed category list.
- Create and remove KPIs per objective.
- Edit KPI name, measurement type, unit, calculation direction, target and weight.
- Live plan-level KPI weight total and SMART completion status.
- Submission-readiness validation for non-empty plan, objective category/text, at least one KPI per objective, required KPI fields, positive targets, SMART score >= 70%, and total KPI weights = 100%.
- Save Draft and Validate & Continue previews.
- Local SMART checklist and wording suggestion previews include explicit notices that no AI service is connected.

### UC-013 — Admin plan review
Route: `/[locale]/admin/plan-reviews`

- Separate queue for submitted plan examples.
- Objective-level and KPI-level comments.
- Edit preview for permitted KPI target and weight fields.
- Validation for positive target, SMART >= 70%, and 100% plan KPI weight.
- Return requires at least one Objective/KPI comment; Approve does not require a comment.
- The UI flags the BRD conflict between “Admin shall not directly rewrite Manager Objectives/KPIs” and the later Admin-edit scenario. Edit mode remains a prototype pending business confirmation.

### UC-015 — Returned plan correction
Route: `/[locale]/manager/reviews`

- Return source, reason, and comments displayed.
- Requires Admin Attention shown as a flag, not a workflow status.
- Manager correction fields and 100% weight / positive target validation.
- Demo branch: Admin-returned plan → Pending Admin Approval; Employee-returned plan → Pending Employee Review, following the later activity steps.
- UI flags the conflicting earlier BRD language that says every resubmission requires Admin review.

### UC-017 — Manager evaluation
Route: `/[locale]/manager/evaluation`

- KPI achievement capped at 100%.
- Lower-is-better with Actual = 0 returns 100%.
- Actual values, manager comments and evidence-reference fields.
- Evidence reference required when the Q4 demo annual score maps to rating 4 or 5.
- Non-final period: individual Admin review submission preview.
- Final period: save as annual draft; no individual submission, with Manager-Year Group submission remaining the next step.
- Evidence is a reference string only; no file upload is implemented.

### UC-018 / UC-020 — Calculation explorer
Route: `/[locale]/manager/calculations`

Reusable helpers: `src/lib/performance-calculations.ts`

- KPI achievement and weighted result.
- Period KPI-weight validation and period result.
- Annual Objectives Result as equal average of all applicable periods; missing period values return no result rather than silently skipping a period.
- Annual competency mapping and weighted result.
- Overall annual result using component weights.
- Rating band lookup.
- Bell Curve floor/ceil allowed-count helper.

### UC-021 — Admin final group review
Route: `/[locale]/admin/approvals`

- Group population and completeness summary.
- Employee score-component drilldowns.
- Approve disabled while the demo group is incomplete.
- Return requires a reason and selection of affected employees.
- Group decision history preview.
- Bell Curve remains a blocker until approved thresholds and business rule are known.

### UC-022 — Bell Curve monitoring
Routes: `/[locale]/admin/bell-curve`, `/[locale]/hcd/calibration`, and Manager-Year Group view.

- Provisional score-based rating distribution.
- Employee score and original rating list.
- Manager-Year Group completion status is read-only; removed manual completion checkboxes.
- No invented minimum/maximum limits, pass/fail status, or automatic calibration.
- BRD contradictions are explicitly shown to Admin/Manager/HCD.

## 2. General UX improvements

- Shared responsive styles for workflow forms, review queues, KPI cards, calculation breakdowns and distribution tables.
- Mobile layout adjustments for plan editor, review queue, data tables and action controls.
- Consistent button/input/textarea styling and clear status feedback.
- Keyboard-visible focus indicators.
- Reduced-motion support.
- Horizontal overflow behavior for wide data tables on narrow screens.
- Added bilingual labels for new workflows and notices.

## 3. Quality and testing

- Added pure calculation unit tests in `src/lib/performance-calculations.test.ts`.
- Added GitHub Actions workflow `.github/workflows/frontend-quality.yml` to run install, lint, typecheck, tests and production build on pushes and pull requests.
- Repository currently has no committed npm/yarn lockfile; workflow uses `npm install` rather than `npm ci`. Committing a lockfile is recommended for deterministic dependency resolution.
- The first workflow attempt failed at Node setup because setup-node's npm cache requires a lockfile. The workflow was corrected to remove that cache setting. Verify the latest run before treating quality gates as passed.

## 4. Routes added

- `/en/admin/plan-reviews`
- `/en/admin/bell-curve`
- `/en/manager/calculations`

Localized Arabic equivalents are provided by the locale route segment.

## 5. Explicit non-goals / not completed by frontend-only work

- Backend persistence, workflow transitions, role/scope authorization and API data.
- Actual AI Wording Improvement or SMART Analysis.
- Evidence file upload/storage.
- Notification delivery and server audit history.
- Final publication or production result visibility enforcement.
- Approved Bell Curve thresholds and calibration policy.

## 6. BRD decisions still required

1. UC-013: Does Admin directly edit submitted Objectives/KPIs or only comment and approve/return?
2. UC-015: Does an Employee-returned plan go directly to Employee Review, or must every resubmission return to Admin approval?
3. UC-021: When a group is returned, do all annual evaluations reopen or only permitted Final Period fields for affected employees?
4. UC-022: Is Bell Curve a strict validation gate with no automatic movement, or is automatic rating calibration required?
5. UC-022: What are the approved minimum and maximum percentages per rating?
6. Rating scale: how should full-precision decimal scores in the gaps between integer ranges be assigned (e.g. 64.5%, 74.5%, 89.5%, 95.5%)?

These decisions are kept visible rather than silently inferred in the UI.
