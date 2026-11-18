# BRD V1.2 — Frontend Coverage & Gap Audit

**Audit date:** 18 November 2026  
**Repository:** `mostafa2425/performance-management-platform`  
**Branch audited:** `main`  
**Source:** `Performance_managment_platform_V1.2.docx` (116 pages)  
**Scope:** Frontend source and routes only. Backend implementation is owned by a separate team.

## 1. Executive summary

The repository contains a broad role-based UI prototype for Admin, Manager, Employee, Department Manager and HCD, including the main performance planning, review, evaluation, history, notification and publication areas. It is **not yet a production-ready BRD implementation**: the majority of records and actions are illustrative/local state, several Admin and HCD modules are summary placeholders, and there is no connected authentication/session or business API flow in the audited frontend.

The frontend should therefore be described as **workflow UI prototype / integration-ready foundation**, not as a completed operational platform.

### Current coverage snapshot

| Area | Current state in repository | Assessment |
|---|---|---|
| Role workspaces and navigation | Five role workspaces and role-specific routes exist | Partial |
| Arabic / English and RTL | next-intl routes, locale provider, root direction | Implemented foundation; translation coverage incomplete |
| PWA | Manifest, service worker and registration exist | Foundation only; verify offline/cache safety |
| Admin cycle management | List/search/year-frequency-status filters, create/scope/deadline preview, detail roster/exclusions/manual-inclusion demo, and edit-deadline/audit preview; all local illustrative state | Partial / API integration gap |
| Employee records / Jisr | Static employee list; no sync status, failure detail, eligibility or inclusion workflow | Gap |
| Objective & KPI planning | Employee plan review and manager objective screens exist, but data is demo; key BRD authoring/validation rules need verification | Partial |
| Admin plan review | Approval area is a static final-group review demo; objective/KPI-level Admin review is not fully represented | Gap |
| Competency templates | HCD summary rows only; no full template editor, weights, job-title mapping | Gap |
| KPI evaluation | Manager evaluation form exists; local calculations and local state, not API-backed | Partial / calculation boundary issue |
| Annual competency evaluation | Rating UI exists, but competency set and 25% weights are hard-coded demo values | Partial |
| Period / annual calculation | Summary displays exist; no authoritative API calculation breakdown | Gap |
| Bell Curve | Readiness warning only; no live limits, distribution, validation or calibrated rating | Gap / blocked by BRD decision |
| Manager-Year Group | Group completion preview exists; member completion is manually toggled demo state | Partial |
| Admin final review | Group-level review UI exists; local decision state only; no full non-final period review workflow | Partial |
| Results publication | Publication schedule/read-only results UI exists; no actual publication API/job | Partial |
| Employee results | Period/annual result view exists; needs real publication state and server-enforced field visibility | Partial |
| Performance history | Role-specific history views exist with illustrative records | Partial |
| Notifications | Notification center and template editor exist; local read state and local template edits | Partial |
| Dashboards / reports | Admin/Department/HCD dashboards and reports use illustrative summary records | Partial |
| Authentication / permissions | Login UI and permission type/helper exist; no connected session provider or route/API enforcement found in audited paths | Critical gap |
| Backend integration | Generic API client exists, but no feature API service usage was found in the audited source search | Critical gap |
| Tests / quality gates | Vitest, ESLint and TypeScript scripts configured; no feature test files surfaced in the audited tree | Needs verification |

## 2. BRD process coverage

The BRD defines the following principal use cases in section 11. Current status below is based on the current route/component implementation, not on the intended page title.

| BRD use case | Requirement | Current frontend coverage | Status |
|---|---|---|---|
| UC-001 | Login to Performance Management Platform | Login screen supports a UI entry point; email/password and Microsoft SSO are not connected to a session/API | Partial |
| UC-002 | View Admin Dashboard | Admin dashboard with illustrative data | Partial |
| UC-003 | View Manager Employees | Manager team directory and employee detail routes | Partial |
| UC-004 | View Employee Performance Details | Manager detail page and role history/detail views; mock data | Partial |
| UC-005 | View Performance Cycles | Search and filters by name, year, frequency and status; cycle summary/list with job-title and employee counts; seed data only | Partial |
| UC-006 | Create Performance Cycle | Create form, scope preview, eligibility exceptions, period/deadline preview and client validation; create/activate are local only | Partial |
| UC-007 | View Performance Cycle Details | Cycle metadata, generated periods, manager-grouped employee sample statuses, exclusions and manual inclusion demo; source data is illustrative | Partial |
| UC-008 | Edit Performance Cycle | Deadline editor, completed-stage read-only preview, period/cycle/chronology validation and local audit preview; locks currently infer completion from dates and must use backend workflow status | Partial |
| UC-009 | View Manager Dashboard | Manager dashboard with illustrative metrics | Partial |
| UC-010 | View Employee Performance Details | Manager employee detail view | Partial |
| UC-011 | Prepare Employee Objectives & KPIs | Manager objectives workspace exists; verify complete Category → Objective → KPI authoring and all BRD validations | Partial |
| UC-012 | Submit Employee Performance Plan | Plan/review surfaces exist; no API submission or workflow transition | Partial |
| UC-013 | Review Employee Performance Plan | Manager/Admin review surfaces exist; Admin objective/KPI-level comments and all review states need completion | Partial |
| UC-014 | Review Performance Plan – Employee / modification request | Employee approve/request-modification UI with mandatory comment for request; local state only | Partial |
| UC-015 | Update Returned Performance Plan – Manager | Manager review queue exists; full return-edit-resubmit lifecycle needs API and verification | Partial |
| UC-016 | Manage Competency Templates | HCD template overview only; no complete template CRUD/copy, competency weights and job-title mapping | Gap |
| UC-017 | Evaluate Employee Objectives & KPIs – Manager | Manager evaluation form; actual values, comments and calculations are local demo state | Partial |
| UC-018 | Calculate Period & Annual Objectives Result | No backend calculation contract or authoritative result rendering | Gap |
| UC-019 | Evaluate Employee Competencies – Manager | Annual 1–5 rating controls exist with demo competencies/weights | Partial |
| UC-020 | Calculate Overall Annual Performance | No authoritative API result / score breakdown integration | Gap |
| UC-021 | Review Final Performance Result – Admin | Group-level final review UI exists; Non-Final Period Evaluation approve/return workflow and returned-group rules need completion | Partial |
| UC-022 | Monitor Performance Rating Distribution (Bell Curve) | UI explains that policy is unresolved; no actual distribution/validation/calibration | Blocked / Gap |
| UC-023 | Finalize & Publish Performance Results | Publication schedule and read-only preview; no finalization/publication job/API | Partial |
| UC-024 | View Performance Results – Employee | Employee period/annual result screen; must be driven by published API state and preserve BRD visibility restrictions | Partial |
| UC-025 | Manage Objective Categories | No dedicated full Admin category management workflow identified | Gap |
| UC-026 | Configure Annual Performance Component Weights | No dedicated full Admin configuration editor identified | Gap |
| UC-027 | Manage Notification Templates | Arabic/English template editor exists; edits are demo-local, fixed recipients/triggers as BRD requires | Partial |

## 3. Important implementation findings

### 3.1 Authentication and authorization — P0

- `src/proxy.ts` currently applies locale middleware only.
- `AuthUser`, `AuthSession` and `hasPermission` are types/helper foundations, but a repository code search did not find `hasPermission` usage.
- The audited feature routes use role props in `AppShell`; this is navigation/UI behavior, not an authorization boundary.
- No authenticated session bootstrap, login API call, Microsoft SSO callback flow, or route guard was found in the audited paths.
- The generic API client uses `credentials: "include"`, but no feature-level API usage was found by searching for `apiRequest(`.

**Required:** backend-owned authentication and authorization; current-user/permission/scope bootstrap; protected routes; API authorization; session-expiry handling; secure cookie/CSRF contract. Hiding a link or action in the browser is not sufficient.

### 3.2 Static mock data and local-only actions — P0 for production readiness

Several screens explicitly label their records as illustrative/demo and keep interactions in React state:
- Employee plan approve/request-modification.
- Manager KPI actuals and annual competency ratings.
- Manager-Year Group completion checkboxes and submission preview.
- Admin final group decision/history.
- Notification read/unread and template editing.
- Admin cycle, employee, approvals and reports lists.
- Department/HCD team, progress, reports, template and calibration summaries.

These are useful for UX review but do not persist, notify another user, enforce workflow, or update server state. Replace them with API-backed query/mutation flows when backend contracts are available.

### 3.3 Manager evaluation — calculation source of truth

The current manager evaluation component calculates KPI achievement, weighted result and competency result in the browser. The BRD describes the calculations, but the frontend technical baseline correctly identifies the backend as authoritative. Before production:
- Send validated Actual values, comments and evidence to the API.
- Render achievement, weighted results, period/annual results and ratings returned by the backend.
- If a client-side preview is retained, label it provisional and reconcile it with server response.
- Do not hard-code competency definitions or weights; load the assigned Job Title template.
- Add measurement-type/unit validation and evidence upload once backend contract and evidence rules are confirmed.

### 3.4 Cycle setup and employee population

BRD UC-006–UC-008 requires a complete cycle configuration flow, not a list only:
- Cycle name/year/frequency and date boundaries.
- Eligible employee scope and manual inclusion where allowed.
- Stage deadline setup and chronological/boundary validation.
- Draft/active state and activation.
- Edit lock for completed stages; current incomplete/future stage dates only.
- Audit history with old/new values, actor and timestamp.

BRD Jisr rules also require latest successful sync data, sync status/failure reasons, employee history retention, manager/org changes, job-title competency coverage and eligibility/exclusion decisions. These are not represented by the current static employee listing.

### 3.5 Objective and KPI authoring validations

The BRD's manager planning use case includes requirements that must be confirmed in the current form before sign-off:
- Category → Objective → one or more KPIs.
- KPI fields: name/description, measurement type, unit, calculation direction, target and weight.
- Measurement types: Percentage, Number/Amount and Duration/Time; valid unit/direction combinations.
- KPI weights total 100% for the applicable Period.
- An Objective cannot be submitted without at least one KPI.
- KPI Actual is not entered during Goal Setting.
- SMART Analysis is available; KPI SMART Score below 70% blocks submission.
- Wording Improvement must not overwrite user text unless the Manager accepts the suggestion.
- Competencies are assigned from Job Title template and are not created/modified by the Manager.

The current objective screens should be audited against each rule, then wired to backend validation errors and workflow locks.

### 3.6 Bell Curve / Manager-Year Group — blocked business decision

The BRD contains edited conflicting language:
- One set of statements says submission is blocked when rating counts fall outside minimum/maximum and no employee is automatically moved.
- Other statements describe automatic calibration by moving the lowest score in an over-limit rating to the next lower rating, preserving original overall score.
- Group return text also differs on whether all annual evaluations reopen or only permitted Final Period Evaluation fields for affected employees.

The UI currently avoids inventing a policy and flags Bell Curve as unavailable. Keep that safeguard. Obtain an approved business decision and backend contract before building the live chart, submission gate, calibrated rating display or return behavior.

### 3.7 Annual vs Period Evaluation

The BRD distinguishes Non-Final Period Evaluations (individual Manager submission and Admin approve/return) from Final Period Evaluations, which contribute to the annual Manager–Year Group and Bell Curve flow. The current evaluation UI and group readiness page do not yet implement the full branching workflow. The final period must be identified from backend cycle/frequency configuration, not assumed to be Q4.

### 3.8 Notification center and templates

- Notification center has role-filtered seed data, search, read/unread filters and deep links.
- Read status is page-local and resets on refresh.
- Template editor changes are local and reset on refresh.
- Template triggers/recipients are intentionally fixed.
- NOT-017's BRD title/recipient/reference exists but message body is not supplied in the BRD; the editor leaves it blank rather than inventing copy.

Production requires notification list/unread count/read mutations, recipient scope, delivery state, template fetch/update APIs and audit trail.

### 3.9 Localization and accessibility

- Locale routing and document `dir` are in place.
- Several feature components still contain inline English/Arabic strings rather than a centralized translation catalog.
- Complete a route-by-route Arabic/English review, including validation/error states, dates, numbers, tables, modals, screen-reader labels, keyboard access and RTL icon/layout direction.
- Agree a business timezone for all cycle deadlines and audit timestamps.

## 4. Recommended delivery backlog

### P0 — Before any production pilot
1. Confirm backend authentication/session model and connect login + Microsoft SSO.
2. Add protected route handling and backend permission/scope bootstrap; never rely on client role labels.
3. Agree API contracts and replace demo data/actions in every operational workflow.
4. Ensure server-authoritative calculations, workflow transitions, publication state and Bell Curve results.
5. Resolve Bell Curve and return-workflow contradictions with the business owner.
6. Add backend-backed authorization tests and frontend tests for critical role visibility / employee data privacy.

### P1 — Core BRD completion
1. Connect the Admin Performance Cycle UC-005–UC-008 screens to backend list/detail/create/activate/manual-inclusion/deadline-update/audit APIs; make workflow locks and eligibility server-authoritative.
2. Build employee population, Jisr sync status/failure details, eligibility/exclusion and manual cycle inclusion.
3. Complete Objective Category administration and full Manager objective/KPI authoring/SMART validation.
4. Complete Admin plan review with Objective/KPI-level comments, approve/return, and returned-plan resubmission.
5. Complete Competency Template management, copy, competency weights and Job Title mapping.
6. Implement Non-Final Period Evaluation review and the Final Period → Manager-Year Group path.
7. Implement period/annual calculation display, group-level Bell Curve and final review.
8. Implement finalization/publication and employee results visibility based only on published state.
9. Complete annual component weight/rating-scale configuration (UC-026).

### P2 — Governance, reporting and release hardening
1. Connect role dashboards and reports to authorized, filterable API data.
2. Complete notification persistence/delivery and Admin template update audit.
3. Complete Performance History with API audit records and correct role/scope visibility.
4. Add upload/evidence UX, file constraints and secure download handling.
5. Finish localization/accessibility/timezone review.
6. Add Vitest/RTL tests and Playwright critical workflows; run lint/typecheck/build in CI.
7. Review PWA service-worker caching to ensure employee performance data is never cached offline or shared across users.

## 5. Backend handoff checklist

The backend team should provide:
- Auth/session endpoints, Microsoft SSO contract, current user, roles, permissions and authorized organizational scope.
- Employee/organization endpoints and Jisr sync status, failed records and eligibility/exclusion flags.
- Cycle CRUD, activation, stage deadlines, allowed edits and audit events.
- Objective category, objective, KPI, SMART analysis and wording-improvement endpoints.
- Plan submit/review/approve/return/resubmit actions and Objective/KPI-level comments.
- Competency templates, Job Title mapping and annual component configuration.
- Evaluation draft/save/submit, Actual validation, comments and evidence upload.
- Period and annual calculation breakdown with full precision and rounding/display rules.
- Manager-Year Group, Bell Curve configuration/limits/distribution/compliance/calibration and group return semantics.
- Admin Non-Final Period review and Final Group review/approval.
- Publication schedule/status and employee-visible result payload.
- Notification list, unread count, read actions, template list/update and delivery status.
- Performance history/audit endpoints.
- Standard error schema, pagination/filtering, concurrency/version field, business timezone and date formats.

## 6. Definition of done

A BRD use case is not complete merely because a route exists. Mark it complete only when:
1. Its BRD fields, business constraints, activity steps and validation outcomes are represented.
2. Data is loaded from the agreed API and scoped by backend authorization.
3. Actions call the corresponding API and reflect success, validation failure, conflict and retry states.
4. Workflow status and locks come from backend responses.
5. Arabic and English UI, responsive behavior and accessibility are checked.
6. Automated tests cover the important success, failure, role-visibility and privacy paths.
7. No demo seed data or local-only state is presented as a real business transaction.
\n\n## 7. Cycle API handoff\n\nThe cycle-specific backend contract requirements are documented in `docs/PERFORMANCE_CYCLE_API_HANDOFF.md`. This document deliberately does not invent endpoint paths or payload formats; the backend team must confirm the wire contract before API wiring.\n