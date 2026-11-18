# Performance Management Platform — Frontend Technical Specification

**Version:** 1.0  
**Status:** Initial baseline derived from BRD V1.2  
**Owner:** Frontend  
**Repository:** `mostafa2425/performance-management-platform`

## 1. Purpose and scope

This document translates the Performance Management Platform BRD into a frontend implementation baseline. It covers frontend responsibilities, role-aware navigation, modules, workflow-aware screens, integration boundaries, quality requirements, and acceptance criteria.

The frontend is responsible for presentation, interaction, client-side input validation, navigation, accessibility, localization, and API integration. The backend remains authoritative for authentication, authorization, workflow transitions, eligibility, calculations, Bell Curve compliance/calibration, audit history, and publication state.

### In scope
- Admin, Manager, Employee, Department Manager, and HCD experiences.
- Performance cycles, objectives, KPIs, competencies, evaluation, results, approvals, monitoring, notifications, and history.
- Arabic/English localization and RTL/LTR layout.
- Email/password and Microsoft SSO entry points.
- Installable PWA foundation.

### Out of scope for the frontend
- Reimplementing or treating business calculations as authoritative.
- Enforcing permissions only in the browser.
- Defining final backend endpoint contracts without agreement with the backend team.
- Offline submission, approval, evaluation, or access to sensitive employee performance records.

## 2. Source-of-truth and decision labels

- **BRD requirement:** explicitly described in BRD V1.2.
- **Frontend design decision:** proposed implementation approach to support the BRD.
- **Backend confirmation required:** unresolved business/API behavior that must be agreed with the backend team and business owner.

Where the BRD contains conflicting edited text, the frontend must not silently choose a rule. The open questions in section 13 must be resolved before implementing the affected behavior.

## 3. Users, roles, and frontend access model

| Role | Primary frontend areas | Scope |
|---|---|---|
| Admin | Cycle setup, employee inclusion, objective configuration, competency templates, reviews, configuration, monitoring, final review, publication, audit | Organization-wide or configured administrative scope |
| Manager | Team objectives/KPIs, plan review, actuals, competencies, evaluations, group submission, direct-report history | Assigned direct reports and authorized Manager-Year Groups |
| Employee | Assigned plan review, modification request, approved objectives, own published results, own history where permitted | Own employee record |
| Department Manager | Finalized results and detailed performance information | Authorized organizational scope |
| HCD | Finalized results and detailed performance information | Authorized organizational scope |

**Security rule:** frontend permission checks are for user experience only. Every API operation and every record returned must be authorized by the backend. Never infer access solely from a role label; scope and workflow state also matter.

### Permission model (frontend capability keys — proposed)
- `cycle.read`, `cycle.create`, `cycle.update`, `cycle.activate`
- `employee.read`, `employee.include`
- `objective.read`, `objective.manage`, `objective.approve`, `objective.request_changes`
- `competency_template.read`, `competency_template.manage`
- `evaluation.read`, `evaluation.edit_actuals`, `evaluation.rate_competencies`, `evaluation.submit`
- `group.read`, `group.submit`, `group.review`, `group.return`, `group.approve`
- `result.read`, `result.publish`
- `configuration.manage`, `bell_curve.read`, `monitoring.read`, `audit.read`

The backend must provide effective permissions and authorized scope (or equivalent policy decisions). The keys above are a suggested frontend vocabulary, not a claim about existing backend claims.

## 4. Business modules and frontend capabilities

| Module (BRD) | Main frontend capabilities | Main roles |
|---|---|---|
| Performance Cycle Management | List/create/edit cycles, configure scope and stage dates, activate cycle, view progress | Admin |
| Objective & KPI Management | Create/edit objectives, KPIs, targets, measurement type, calculation direction, weights | Manager, Admin where specified |
| Objective & KPI Review and Approval | Review submitted plans, approve/return, comments, employee review/request modification | Admin, Employee |
| Competency Template Management | Create/copy templates, configure competencies and weights, map templates to job titles | Admin |
| Performance Evaluation | Enter KPI actuals, comments/evidence, annual competency ratings, save drafts | Manager |
| Period/Annual Result Management | View period results, annual objectives/competency results, statuses | Admin, Manager, authorized stakeholders |
| Annual Performance Calculation | Display backend-calculated results and rating breakdown | Admin, Manager as authorized |
| Annual Final Review & Publication | Review/return/approve Manager-Year Groups and publish results | Admin |
| Performance Configuration | Configure annual objectives/competencies weights and rating scale | Admin |
| Bell Curve Monitoring & Compliance | Display limits, counts, distribution, validation status and calibrated rating where applicable | Manager, Admin |
| Monitoring & Dashboards | Cycle progress, pending actions, completion metrics and authorized summaries | Role-dependent |
| Performance History & Audit | Timeline of approvals, returns, comments, changes and historical results | Role/scope-dependent |

## 5. Workflow-aware UI

The BRD describes the core stages:
1. Objective Setting
2. Admin Review
3. Employee Review
4. Active Performance
5. Manager Evaluation

Final review, Bell Curve validation/calibration, group approval, and publication follow the evaluation workflow.

The UI must render actions from backend-provided state and allowed transitions. Do not derive workflow transitions from dates or local role checks alone.

### Suggested workflow presentation
- Cycle overview: stage timeline, stage dates, completion counts, pending actions.
- Employee plan: draft/submitted/returned/approved state, comments and action history.
- Manager evaluation: draft/progress/completed state, editable actuals only while permitted.
- Manager-Year Group: completion status, Bell Curve distribution, submit eligibility, return/approval state.
- Employee results: visible only when backend indicates publication and user is authorized.

### UI states
Every workflow screen must support: loading, empty, error, permission denied, read-only, editable, submitting, submitted, returned, locked, and stale/conflict state where applicable.

## 6. Performance periods and evaluation UX

The BRD supports frequency-based periods:
- Quarterly: Q1–Q4.
- Semi-Annual: H1–H2.
- Annual: one annual period.

Competency evaluation is annual. Period evaluation and annual evaluation must be visually distinguishable. The frontend should display period labels and the active performance year supplied by the API rather than deriving them from the device clock.

### KPI evaluation form
- Display approved KPI, target, measurement type, calculation direction and weight as read-only during evaluation.
- Allow Actual, optional comment, and optional evidence only when the workflow permits.
- Validate input shape and required fields client-side for usability; backend validation remains authoritative.
- Display achievement and weighted result exactly as returned by the backend.
- Do not allow manual edits to calculated values.
- Require evidence for ratings 4 or 5 only if the backend/business rule confirms the applicable scope and condition.

## 7. Results and calculation display

The BRD describes:
- Higher-is-better achievement: (Actual / Target) × 100.
- Lower-is-better achievement: (Target / Actual) × 100.
- Lower-is-better with Actual = 0: achievement treated as 100%.
- Weighted KPI Result = Achievement × KPI Weight.
- Period objectives results are combined into an annual objectives result according to the configured frequency.
- Competency ratings map to percentage values and are weighted.
- Initial overall component weights are Objectives 80% and Competencies 20%, configurable with a 100% total.
- Rating bands are configured in the BRD.

**Implementation rule:** display backend-calculated values and explanations. Do not duplicate calculation logic in the frontend for authoritative display, filtering, or decisions. A local preview may be added only if explicitly agreed and clearly labelled provisional.

### Calculation questions requiring confirmation
- BRD text differs on whether KPI achievement shown to users is uncapped actual achievement or capped achievement used in scoring.
- Confirm precision, rounding, and display formatting rules.
- Confirm whether the API returns the full calculation breakdown and configuration version.

## 8. Bell Curve and Manager-Year Groups

Bell Curve is a controlled business workflow, not just a chart. The frontend should display:
- Manager-Year Group population.
- Rating distribution and counts.
- Configured minimum/maximum percentage and allowed employee counts.
- Current compliance status and blocking reasons.
- Original score-based rating and calibrated final rating as separate fields if calibration is confirmed.
- Submission/return/approval state and comments.

The UI must never invent or independently calculate authoritative distribution limits. Backend must return computed counts, compliance, and allowed actions.

**Important:** BRD V1.2 contains conflicting statements about validation-only blocking versus automatic calibration and about which period/annual values reopen after return. Do not implement automatic reassignment or a final-rating workflow until the business owner and backend team confirm the final rule.

Bell Curve details must not be exposed to Employees unless an explicit approved requirement changes this rule.

## 9. Integrations and frontend boundaries

| Integration | BRD role | Frontend handling |
|---|---|---|
| Jisr | Source of truth for employee and organization data | Consume synchronized employee/profile/scope/status data; display sync status and exclusion/eligibility flags supplied by backend |
| Succession System | Job Description by job title/identifier | Display read-only reference description; absence must not be treated as a frontend blocker |
| Microsoft identity | SSO option | Start backend-approved OIDC/OAuth flow; do not handle provider secrets in browser |
| Notifications | In-app/email notification requirements | Display notification center, unread state, deep links and preference controls only where API supports them |
| AI wording/SMART analysis | BRD mentions wording improvement and SMART analysis | Treat as optional capability behind API and feature flag; no direct provider key in frontend |

## 10. Authentication and session behavior

Both methods are required:
1. Email/password.
2. Microsoft SSO.

The backend team must confirm whether authentication is implemented by a BFF/session cookie or bearer tokens. Preferred frontend integration is secure, HttpOnly, Secure, SameSite cookies through a backend/BFF boundary. Do not persist long-lived access or refresh tokens in localStorage/sessionStorage.

Required UI states: signed out, authenticating, authenticated, session expired, unauthorized, SSO cancelled/failed, password validation error, and account disabled where supplied by API.

## 11. Localization, accessibility, and responsive behavior

- English and Arabic are first-class locales.
- Support LTR and RTL at document, component, icon, table, drawer, modal, and form levels.
- Locale switching must not lose unsaved form state without warning.
- Use translation keys; do not embed user-facing strings directly in feature components.
- Use semantic labels, keyboard navigation, visible focus, accessible validation, and appropriate contrast.
- Data-heavy tables must have responsive strategies (horizontal scroll, column prioritization, or detail drawer).
- Date/time display must use an agreed business timezone; never assume the browser timezone is the business timezone.

## 12. Technical architecture (frontend design decision)

### Stack
- Next.js App Router + TypeScript.
- Ant Design v6 for enterprise components.
- Tailwind CSS for layout, spacing, responsive utilities and app-level styling.
- TanStack Query v5 for server state, caching, mutations and invalidation.
- Localization library: select and standardize one implementation during foundation (recommended: next-intl).
- Schema validation: Zod (recommended).
- Unit/component tests: Vitest + React Testing Library.
- End-to-end: Playwright.
- API mocking: MSW.

### Architecture principles
- Server Components by default; Client Components only for interactivity, browser APIs, AntD contexts and client hooks.
- QueryClient must be request-scoped for server rendering; never share user-specific cache across requests.
- Central API client with typed errors, credentials policy, request IDs and consistent response parsing.
- Feature-first folders with clear ownership.
- Avoid business rules in components; use feature services/hooks and backend responses.
- Use stable query keys and invalidate affected queries after mutations.
- Do not cache sensitive employee evaluation/result payloads in a public/shared service-worker cache.

### Proposed routes
- `/[locale]/login`
- `/[locale]/auth/callback`
- `/[locale]/admin/performance-cycles`
- `/[locale]/admin/employees`
- `/[locale]/admin/objective-configuration`
- `/[locale]/admin/competency-templates`
- `/[locale]/admin/performance-configuration`
- `/[locale]/admin/reviews`
- `/[locale]/admin/manager-year-groups`
- `/[locale]/admin/results`
- `/[locale]/admin/monitoring`
- `/[locale]/admin/audit`
- `/[locale]/manager/team`
- `/[locale]/manager/objectives`
- `/[locale]/manager/evaluations/[evaluationId]`
- `/[locale]/manager/manager-year-groups/[groupId]`
- `/[locale]/employee/my-plan`
- `/[locale]/employee/my-results`
- `/[locale]/department/results`
- `/[locale]/hcd/results`

Routes are a proposed navigation map and may be adjusted after screen inventory and API contract review.

## 13. Open questions / decisions required

| ID | Question | Why it matters | Owner |
|---|---|---|---|
| Q-01 | Is Bell Curve validation-only, automatic calibration, or a defined combination? | Changes group review UX and final-rating fields | Business + Backend |
| Q-02 | What is the exact source/display rule for uncapped KPI achievement versus capped scoring? | Prevents misleading KPI result display | Business + Backend |
| Q-03 | What is the final distinction between Period Evaluation and Annual Evaluation submission/approval? | Determines evaluation pages and states | Business + Backend |
| Q-04 | Which values can be edited after a group is returned, and at what scope? | Determines form locks and return handling | Business + Backend |
| Q-05 | Confirm the 4/5 rating evidence requirement: per KPI, per employee, annual rating, or another rule. | Controls mandatory evidence validation | Business |
| Q-06 | What are the exact rating bands, boundaries, and treatment above 100%? | Results and rating display | Business + Backend |
| Q-07 | Which Jisr fields reliably identify exclusion categories and eligibility? | Employee population and counts | Backend + HR |
| Q-08 | Which authentication protocol and session model will be exposed for email/password and Microsoft SSO? | Login, callback and session handling | Backend + Identity |
| Q-09 | Provide OpenAPI/Swagger, error schema, pagination/filtering, upload limits, timezone and concurrency/version rules. | API client and forms | Backend |
| Q-10 | What is the business timezone and date-only handling policy? | Deadlines and date display | Business + Backend |
| Q-11 | What are the official Arabic/English labels and approved terminology? | Localization accuracy | Business |
| Q-12 | Provide Bell Curve reference, KPI reference and TD notes attachments referenced by the BRD. | Configuration and help content | Business |

## 14. API contract checklist for backend handoff

Before wiring production APIs, agree on:
- Base URL per environment and API version.
- Auth/session flow, CSRF policy, cookie domain and SSO callback.
- Current user profile, role, permissions and authorized organizational scope.
- Standard success/error response envelope and validation error format.
- Pagination, sorting, filtering and search conventions.
- Cycle, stage and workflow status enums plus allowed transitions.
- Employee eligibility/exclusion and Jisr sync status.
- Objective/KPI/competency schemas and lock/read-only flags.
- Evaluation draft/save/submit and evidence upload contracts.
- Backend calculation breakdown, rating and configuration version.
- Bell Curve distribution, limits, compliance and calibration payload.
- Manager-Year Group return/approval contract.
- Publication status and employee result visibility.
- Audit history, notification list/read actions.
- Optimistic concurrency/version field and conflict response.
- Business timezone, date/time formats and locale behavior.

## 15. Acceptance criteria for the frontend foundation

- App builds and runs with strict TypeScript.
- Arabic and English routes render with correct direction.
- Ant Design theme and Tailwind utilities coexist without global reset conflicts.
- QueryClient is isolated per server request and stable on the client.
- Auth screens expose both email/password and Microsoft SSO paths.
- Role-aware navigation uses backend-provided identity/permissions.
- No sensitive performance data is cached for offline use.
- PWA manifest and installability baseline are present.
- Standard loading, empty, error, forbidden and not-found states exist.
- Environment variables are validated and secrets are never committed.
- Tests cover providers, locale direction, route guards and core UI states.

## 16. Delivery sequence

1. Repository foundation and quality gates.
2. App shell, authentication integration boundary, localization and navigation.
3. Admin cycle and configuration screens.
4. Objective/KPI planning and review.
5. Manager evaluation and employee plan review.
6. Results, Bell Curve and Manager-Year Group workflows.
7. Monitoring, notifications, history, accessibility and release hardening.
