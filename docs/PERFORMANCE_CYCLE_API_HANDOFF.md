# Performance Cycle API — Backend Handoff

**Frontend owner:** Performance Management Platform  
**BRD source:** `Performance_managment_platform_V1.2.docx`, UC-005–UC-008 and Sections 8–9  
**Status:** Contract requirements only. No endpoint paths or wire formats are assumed; the backend team must confirm its actual API contract before the frontend replaces demo state.

## 1. Scope

The Admin Performance Cycle workspace requires backend support for:
- UC-005: list, search and filter cycles.
- UC-006: create a Draft cycle or activate a valid cycle, including scope and generated periods.
- UC-007: read cycle configuration, periods, current period/stage, manager-grouped employee progress and excluded employees; manually include an authorized exception.
- UC-008: update permitted stage deadlines and return audit history.

The frontend already has a generic credentialed API client at `src/lib/api/client.ts`. The current cycle workspace still uses illustrative seed data and React state. Do not treat any local action as a persisted business transaction.

## 2. Required read models

### Cycle list (UC-005)
Each row must provide:
- Cycle ID, Arabic and English cycle names.
- Performance Year, Frequency (Quarterly / Semi-Annual / Annual), Start Date, End Date, Status (Draft / Active / Closed).
- Number of Job Titles and final unique Employees in Scope.
- Manager count may be returned as a useful supplementary field.

List query requirements:
- Search by Cycle Name.
- Filter by Performance Year, Frequency and Status.
- Stable pagination/sorting contract (confirm with backend).
- Summary counts must respect the same authorized Admin scope.

### Cycle detail (UC-007)
Return:
- Cycle configuration and scope counts.
- Generated periods: Q1–Q4, H1–H2 or Annual; each period's start/end and Completed / Current / Upcoming status.
- Current Period and Current Stage.
- Five configured workflow stages and deadlines once at cycle level.
- Current period's stage timeline once at cycle level (not repeated inside every period).
- Manager groups and employee rows for the selected Cycle + Period. Each employee needs employee ID/name, Job Title, Business Unit, Department, current performance status and last-updated timestamp.
- Period result and available historical workflow records for completed periods, read-only.
- Employees Not Included, with employee information, eligibility status and exclusion reason.

The UI should expand the Current Period by default; Completed and Upcoming periods should be collapsed by default. Employee statuses must be independent because employees can progress through the workflow at different times.

### Employee scope and eligibility
Jisr is the source of truth for employee and organizational master data. The API must expose the latest successfully synchronized employee data and the latest sync status/failure reasons where applicable. Preserve historical performance records when organizational attributes or manager assignments change.

For cycle selection:
- Department, Job Title and specific Employee scope selections are combined without duplicates.
- Employees in another Active Performance Cycle are ineligible and must expose the active cycle name.
- Employees with less than six months of service are excluded by default and flagged.
- Admin may manually include an under-six-month employee as an authorized exception.
- Other exclusion categories remain excluded unless explicitly allowed by approved eligibility rules.
- Return final unique employee and manager counts from the server; do not rely on client-side calculations for activation.

## 3. Required commands

The backend should expose equivalent operations (actual route names to be agreed):

| Operation | Required behavior |
|---|---|
| Create Draft | Validate names, year, frequency, cycle dates, scope, periods and five stage deadlines; save as Draft without activation |
| Activate | Revalidate all mandatory fields and final employee scope atomically; transition Draft → Active; notify included Managers and Employees after successful activation |
| Manual inclusion | Add an eligible exception to the selected cycle with actor, reason/exception type and timestamp; do not reopen other employees' completed stages |
| Update deadlines | For Draft, permit editing before activation. For Active, permit current incomplete and future stage dates only; preserve completed historical timestamps/records |
| Read audit | Return old value, new value, user and date/time for every deadline change |

## 4. Validation and concurrency

Server-side validation is authoritative:
- Cycle End Date is system-calculated to complete one Performance Year and is read-only to Admin.
- Frequency generates four quarterly, two semi-annual or one annual period.
- Period boundaries must remain within the Cycle.
- Stage deadlines must remain within the applicable Period and retain chronological order.
- Active cycle deadline edits cannot alter completed stages.
- An employee cannot be in more than one Active Performance Cycle at the same time.
- Activation must reject invalid or empty final scope.
- Deadline updates should be concurrency-safe. Provide a version/ETag or equivalent conflict mechanism so stale edits receive a conflict response instead of overwriting newer changes.

Do not infer a completed stage from its date alone. The backend must return authoritative workflow stage status and which deadlines are editable.

## 5. Security and response contract

- Every endpoint must enforce authenticated user, Admin role, authorized organizational scope and action permission on the server.
- Hiding controls in the frontend is not an authorization mechanism.
- Use the agreed session/cookie and CSRF model; the existing frontend API client sends credentials with requests.
- Provide consistent success and error envelopes, including validation field errors, forbidden, not found, conflict and server failure.
- Define pagination, date-only format, business timezone and audit timestamp format.
- Do not expose other employees' data outside the Admin's authorized scope.

## 6. Frontend integration acceptance

When the backend contract is available, frontend integration is complete only when:
1. Cycle list, filters and summary are API-backed.
2. Create Draft, Activate, Manual Inclusion and Edit Deadlines call server commands.
3. The UI renders server-returned periods, employee scope, eligibility, workflow states and audit history.
4. Completed-period records and completed-stage deadlines are read-only based on server state.
5. Loading, empty, validation, forbidden, conflict, network and retry states are handled.
6. Successful activation reflects server-confirmed status and notification outcome; the UI never reports success before the API confirms it.
7. Tests cover permission boundaries, active-cycle duplicate prevention, eligibility exceptions, deadline ordering/bounds, stale update conflicts and completed-stage immutability.

## 7. Open decisions / dependencies

- Confirm the final canonical stage taxonomy and whether all five deadline labels in the current UI match the approved business wording.
- Confirm business timezone and exact boundary inclusivity for deadline validation.
- Confirm the backend's actual endpoint paths, payloads, error envelope, pagination and concurrency strategy.
- Resolve any edited/conflicting BRD wording with the business owner; do not silently encode a frontend interpretation as policy.
