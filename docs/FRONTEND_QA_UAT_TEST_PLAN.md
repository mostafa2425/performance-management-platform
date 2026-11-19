# Frontend QA & UAT Test Plan

## Release scope
- Brand primary: #163366
- Global typography: fixed CSS font sizes increased by 2px from the previous baseline.
- PWA manifest and service worker registration.
- Global SEO metadata plus localized Login, Manager, Admin, HCD, and Employee workspace metadata.
- Arabic RTL and English LTR routes.
- Existing frontend workflows remain demo/local-state until backend APIs and role accounts are connected.

## Automated deployment smoke checks
Run against the production alias after each release:
- [ ] GET /en/login returns 200 and HTML lang=en, dir=ltr.
- [ ] GET /ar/login returns 200 and HTML lang=ar, dir=rtl.
- [ ] GET /manifest.webmanifest returns 200 with standalone display and theme_color #163366.
- [ ] GET /sw.js returns 200 and does not cache navigation HTML or /api responses.
- [ ] GET /en/manager and /ar/manager return 200.
- [ ] GET /en/admin and /ar/admin return 200.
- [ ] GET /en/hcd and /ar/hcd return 200.
- [ ] GET /en/employee/performance and /ar/employee/performance return 200.
- [ ] Verify HTML head includes title, description, Open Graph, Twitter card, and manifest link.
- [ ] Verify theme color meta equals #163366.

## Role-based UAT scenarios

### Admin
1. Create a performance cycle and configure frequency, dates, stages, and deadlines.
2. Configure objective categories and annual objective/competency weights; reject totals other than 100%.
3. Configure competency templates and identify missing job-title mappings.
4. Review an objective plan; approve it or return it with at least one actionable comment.
5. Review annual manager-year group; prevent approval while required evaluations are incomplete.
6. Return a group with a reason and affected employees; verify the permitted resubmission scope.
7. Publish approved results and verify publication state is visible to employees.

### Manager
1. Open the direct-report team and verify only authorized employees are listed.
2. Create an objective plan from scratch, template, and previous period.
3. Validate KPI fields, direction, target, weights, and SMART checklist.
4. Resubmit an Admin-returned plan and verify comments are addressed.
5. Enter actuals and manager comments; verify achievement caps and Lower-is-Better zero handling.
6. Submit period evaluations and annual manager-year group only when the applicable rules permit.

### Employee
1. Review assigned objectives and KPI targets.
2. Complete employee review only when the workflow stage is active.
3. Confirm employee cannot edit manager/admin-only fields.
4. View only approved and published period/annual results.
5. Verify performance history and development information are scoped to the signed-in employee.

### HCD
1. Monitor cycle progress and department participation.
2. Identify missing competency templates and job-title mappings.
3. Review Bell Curve population and distribution.
4. Verify the system blocks final submission when policy thresholds or required completion data are missing.

### Cross-role and responsive checks
1. Verify role and organizational-scope authorization on every protected API and route (backend enforcement required).
2. Verify Arabic RTL and English LTR across navigation, tables, dialogs, forms, and validation messages.
3. Test widths 360px, 390px, 768px, 1024px, and desktop.
4. Verify keyboard navigation, visible focus, labels, and reduced-motion behavior.
5. Test required/invalid/empty/loading/error states and recoverability.
6. Verify notification read/unread, deep links, and bilingual content when notification APIs are connected.

## Release blockers / dependencies
- Backend APIs, authentication, role-based test accounts, organization data, and persistence are required to execute end-to-end multi-user UAT.
- Frontend demo data and local state cannot prove authorization, persistence, notification delivery, or cross-user workflow transitions.
- BRD conflicts remain business decisions: Admin editing during plan review; employee-returned plan routing; group-return scope; Bell Curve validation-only vs automatic calibration; missing Bell Curve thresholds; rating decimal gaps.
- UAT sign-off must be completed by Admin, Manager, Employee, and HCD business representatives after backend integration.
