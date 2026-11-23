# PMP API guide for frontend developers

This guide explains how to call the Performance Management Platform API (v1) from a frontend:
how to log in, how the API reports errors, the rules each screen has to respect, and every
endpoint with a real request and response. Every example here was captured from a run of the
Postman collection against a freshly seeded demo database (fictional people only); ids and
values on your server will differ.

Files next to this guide:

| File | What it is |
|---|---|
| `PMP-API.postman_collection.json` | 144 requests covering every endpoint, in an order that runs end to end on any server |
| `sample-evidence.pdf` | The file the evidence-upload requests send |
| `tools/build_collection.py` | Generates the collection (edit this, not the JSON) |
| `tools/run_collection.mjs` | Runs the collection against a throwaway database and checks every response |

The machine-readable contract (OpenAPI) is served by the backend at `GET /docs/api.json`, with
a browsable view at `GET /docs/api`. When this guide and the OpenAPI file disagree, the OpenAPI
file wins: it is generated from the code.

---

## Contents

1. [Quick start with Postman](#1-quick-start-with-postman)
2. [Basics: URL, headers, auth](#2-basics-url-headers-auth)
3. [Responses, pagination and filters](#3-responses-pagination-and-filters)
4. [Errors](#4-errors)
5. [Concurrency: versions and 409](#5-concurrency-versions-and-409)
6. [Units: basis points, dates, times, decimals](#6-units-basis-points-dates-times-decimals)
7. [Roles and what each one sees](#7-roles-and-what-each-one-sees)
8. [The business flow in one page](#8-the-business-flow-in-one-page)
9. [Endpoint reference](#9-endpoint-reference)
   - 9.1 [Auth](#91-auth) · 9.2 [Me, meta, employees](#92-me-meta-employees)
   - 9.3 [Configuration](#93-configuration-admin) · 9.4 [Eligibility](#94-eligibility-admin)
   - 9.5 [Cycles](#95-cycles) · 9.6 [Plans](#96-plans) · 9.7 [Evaluation and evidence](#97-evaluation-and-evidence)
   - 9.8 [Groups and final review](#98-groups-and-final-review) · 9.9 [Results](#99-results)
   - 9.10 [Sync runs and Admin grants](#910-sync-runs-and-admin-grants)
10. [Error rule codes](#10-error-rule-codes)
11. [Email links and the HashRouter](#11-email-links-and-the-hashrouter)
12. [UAT test clock](#12-uat-test-clock)
13. [Frontend checklist](#13-frontend-checklist)

---

## 1. Quick start with Postman

**The short version (local or testing):**

```bash
php artisan migrate:fresh --seed --seeder=DemoSeeder   # wipes this database, then loads the demo data
php artisan pmp:clock --reset
```

Then import `PMP-API.postman_collection.json` and run it as it is: its variables already point at
`http://localhost:8001` and the demo accounts. Do the two terminal clock steps when the folders
ask for them (1.2). To run it again, start over from `migrate:fresh`: after one run the two test
employees are members of an active cycle, so a second run on the same data fails when it tries to
put them in a new one.

The rest of this section explains the variables, for running against other data.

The collection is not tied to the demo data. It reads ids, competencies and the policy from the
API as it goes, and computes the cycle dates from today. Its own **collection variables** hold
the server and four test accounts plus one extra employee. No Postman environment is needed.

### 1.1 The collection variables

Open the collection in Postman and go to its **Variables** tab:

| Variable | What to put there |
|---|---|
| `baseUrl` | The server origin only, e.g. `http://localhost:8001` or `https://<uat-host>`. Every request already carries the `/api/v1` prefix and version in its path (`{{baseUrl}}/api/v1/auth/login`) |
| `lang` | `en` or `ar` (the `Accept-Language` of every request) |
| `adminEmail`, `adminPassword` | An Admin account |
| `managerEmail`, `managerPassword` | A manager (has active direct reports) who is **not** an Admin |
| `employeeEmail`, `employeePassword` | A direct report of that manager, not an Admin (plan A) |
| `employee2Email`, `employee2Password` | Another direct report of the same manager, not an Admin (plan B) |
| `extraEmployeeCode` | The employee code (e.g. `D0033`) of one more employee who is not one of the two above. Used for draft overrides, a plan that is deleted, and removing a member |
| `clockOffsetDays` | `0`, unless the server's test clock is already moved: then the number of days it is ahead (see `php artisan pmp:clock`) |

The two employees and the extra employee must be **eligible today**: active, at least six months
of service, a job title that has a competency template, no exclusion, and not a member of
another active cycle. The manager may have more reports; only the two named employees are put in
the test cycle. Folder **02 Check the test accounts** verifies all of this before anything is
changed, and tells you which condition fails.

The collection comes filled in for a local backend with the demo seed (all passwords
`password`):

| Variable | Demo value |
|---|---|
| `adminEmail` | `admin@pmp-demo.test` |
| `managerEmail` | `faisal.placeholder@pmp-demo.test` |
| `employeeEmail` | `yousef.demo@pmp-demo.test` |
| `employee2Email` | `maha.fictional@pmp-demo.test` |
| `extraEmployeeCode` | `D0033` |

For UAT, change `baseUrl` and the accounts there. Type the UAT values in the **Current value**
column: Postman keeps current values on your machine and doesn't put them in exports or shared
copies, so real passwords don't end up in the file in git. (If you have an environment selected
that defines the same variable names, its values win over the collection's.)

### 1.2 Running it

1. In Postman, import `PMP-API.postman_collection.json` and set its variables (1.1). Leave the
   environment selector on "No environment".
2. Run the folders in order (Postman's Collection Runner, or request by request). The first
   request computes the run's dates and a short `runTag` that makes created names unique. Each
   request checks its response and saves what the next requests need (`cycleId`, `planAId`,
   `planAVersion`, `groupId`, ...) as collection variables.
3. Two folders start with a **terminal step** on the server (see [section 12](#12-uat-test-clock)):
   - before **07 Evaluation**: `php artisan pmp:clock --advance="222 days"`
   - before **09 Results**: `php artisan pmp:clock --advance="93 days"`
   - when finished: `php artisan pmp:clock --reset`

What each folder does to the server:

| Folders | Effect |
|---|---|
| 00 Auth, 01 Read-only, 02 Check the test accounts, 11 Logout | Read only. Safe on any server, at any time |
| 03 Configuration | Publishes a new policy version **with the same values** as the current one, creates and deletes a template and a category, edits email template NOT-001 and **restores** its text |
| 04 Eligibility | Creates an inactive exclusion rule and deletes it |
| 05 Cycles | Creates and deletes a draft; creates, scopes and **activates** "API test cycle &lt;runTag&gt;". Activation can't be undone; the cycle stays |
| 06 Plans to 09 Results | Plans, evaluations, an evidence file, a group and published results in that test cycle, for the two test employees |
| 07 and 09 (terminal steps) | Move the server's clock for **every** user and cycle on it |
| 10 Admin grants | Grants Admin to employee 2 and revokes it (skipped if employee 2 is already an Admin) |

### 1.3 Running it on UAT

- **Smoke test, any time:** run only 00, 01, 02 and 11. Nothing changes.
- **Full run:** only when nobody else is testing on UAT, because the clock steps push every
  cycle on the server through its deadlines: members are marked missed, groups are published.
  Prefer a dedicated or freshly restored UAT database. Afterwards run `php artisan pmp:clock
  --reset`; the test cycle remains and can be ignored (or the database restored).
- The full run passes only if the server's Bell Curve allows the two ratings it produces for a
  group of two (by default one employee at level 4 and one at level 3, as the demo policy
  allows). If not, **Submit the group** fails and the response lists the blockers.

### 1.4 Running everything automatically

`node docs/api/tools/run_collection.mjs --fresh` (from `backend/`) rebuilds the throwaway
database `pmp_testing_demo`, runs all requests against a backend on :8099 that uses that
database, and moves the clock between folders, using the collection's variables.
`--env <file>` overrides them from a Postman environment file. It
refuses to run against any other database. Last runs: 144 passed, 0 failed, both with the demo
accounts on a fresh database and with a different manager, employees and extra employee (in
Arabic) on a database that already had an active cycle and published results.

---

## 2. Basics: URL, headers, auth

**Base URL:** `{origin}/api/v1`, for example `http://localhost:8001/api/v1`. All paths in this
guide are relative to it.

**Headers on every request:**

| Header | Value | Why |
|---|---|---|
| `Accept` | `application/json` | Always get JSON errors, never an HTML page or a redirect |
| `Authorization` | `Bearer <token>` | Every endpoint except `POST auth/login` |
| `Accept-Language` | `en` or `ar` | Language of messages and of single-language names (see below). Anything else falls back to `en` |
| `Content-Type` | `application/json` | On requests with a JSON body. Not on evidence upload (multipart) |

**Logging in.** `POST auth/login` with `{email, password}` returns a token. Store it (memory or
`sessionStorage`) and send it as a Bearer token. There are no cookies, no CSRF token and no
refresh token.

- The token expires: the response's `expires_at` is 4 hours after login (`SANCTUM_EXPIRATION`,
  in minutes). After that any call gives **401**; send the user back to the login screen.
- `POST auth/logout` revokes only the token used for that request.
- Logins are limited to **10 per minute per IP**; more give **429 `too_many_requests`**.
- Inactive or terminated employees get **403** at login.
- A wrong email or password is a **422 `validation_failed`** with the message on `fields.email`.

**Language of names.** Two shapes exist, and you need to handle both:

- **Bilingual objects** `{"ar": "...", "en": "..."}`: everything an Admin configures (cycle
  names, objective categories, templates and competencies, level labels, email templates,
  exclusion categories, eligibility lookups) and the `name` in preview, eligibility and override
  rows. Pick the language on the client: `name[lang] ?? name.en`.
- **Plain strings**, already localised by `Accept-Language`: people (`full_name`, `name` inside
  `employee`, `actor`, `manager`), org lookups on the employee record (`department.name`,
  `job_title.name`, ...) and error messages. Change the header and re-fetch to switch language.

Free text typed by users (objective text, KPI names, comments, reasons) is stored as typed, in a
single language.

---

## 3. Responses, pagination and filters

**Success bodies** wrap the payload in `data`:

```json
{ "data": { "id": 2, "status": "active" } }
```

Some endpoints add top-level siblings next to `data`: `meta.activation` on cycle activation,
`manager_id` and `bell_curve` on team evaluations. `204 No Content` has no body (deletes, logout,
admin grants).

**Paginated lists** use Laravel's paginator. Query parameters: `page` (from 1) and `per_page`
(default 25, maximum 100).

```json
{
  "data": [ ... ],
  "links": { "first": "...?page=1", "last": "...?page=1", "prev": null, "next": null },
  "meta": { "current_page": 1, "from": 1, "last_page": 1, "per_page": 25, "to": 3, "total": 3,
            "path": "...", "links": [ ... ] }
}
```

`GET cycles/{cycle}/plan-status` uses a slimmer `meta` with only
`current_page`, `per_page`, `total` and `last_page`. Read only those four fields and your code
works for both shapes.

Unpaginated lists (`meta/objective-categories`, `cycles`, `admin/config/competency-templates`,
`admin/config/notification-templates`, `results`, `plans/{id}/history`, ...) return a plain
`data` array.

**Filters** use `filter[name]=value`, for example
`GET plans?filter[cycle_id]=2&filter[status]=approved`. A few older parameters are plain query
parameters instead (`status`, `as_of`, `manager_id`, `cycle`, `type`, `reason`). Each endpoint in
section 9 lists what it accepts. An unknown `filter[...]` is a 400 `validation_failed`.

---

## 4. Errors

Every error has the same envelope:

```json
{
  "error": {
    "code": "validation_failed",
    "message": "Human-readable text in the request language.",
    "fields":  { "objectives.0.kpis.1.unit": ["The unit is not allowed for this measurement type."] },
    "details": { "rule": "..." }
  },
  "request_id": "bcfd365f-8c7e-4862-9b81-84b07223520f"
}
```

`fields` appears only on `validation_failed`, `details` only when there is something to add.
Log or show `request_id` on unexpected errors: the backend logs it too, so support can find the
request.

| HTTP | `error.code` | When | What the UI should do |
|---|---|---|---|
| 400 | `validation_failed` | Unknown filter or sort | Bug in the client |
| 401 | `unauthenticated` | Missing, wrong, expired or revoked token | Clear the token, go to login |
| 403 | `forbidden` | The role may never do this (e.g. an employee opening an admin page) | Show "not allowed", hide the control |
| 404 | `not_found` | Unknown id, or a record the user may not know exists | "Not found" page |
| 405 | `method_not_allowed` | Wrong HTTP method | Bug in the client |
| 409 | `conflict` | Stale `version`, or a duplicate (second plan for a member) | Offer to reload (section 5) |
| 422 | `validation_failed` | The body is malformed or a field is invalid | Show each `fields` message next to its input |
| 422 | `domain_rule_violated` | The body is valid but a business rule refuses it | Show `message`; branch on `details.rule` |
| 429 | `too_many_requests` | Login rate limit | "Try again in a minute" |
| 500 | `server_error` | Bug on the server | Generic error with `request_id` |

### 422 `validation_failed`: map `fields` to inputs

The keys of `fields` are dotted paths into your request body, so they map one to one to form
inputs: `name.en`, `stages.goal_setting`, `objectives.0.kpis.1.weight_bp`,
`kpis.0.actual`, `subject.en`. Use the same path as the input's `id` or `name` and you can show
every message without special cases. Example (email template with an unknown placeholder):

```json
{
  "error": {
    "code": "validation_failed",
    "message": "Unknown placeholders: [Nickname]. Allowed: [Recipient Name], [Manager Name], [Cycle Name], [Cycle / Period], [Performance Year].",
    "fields": {
      "subject.en": ["Unknown placeholders: [Nickname]. Allowed: [Recipient Name], [Manager Name], [Cycle Name], [Cycle / Period], [Performance Year]."]
    }
  },
  "request_id": "8040ee0b-8b44-4136-aaab-4dfe69fe63a9"
}
```

### 422 `domain_rule_violated`: branch on `details.rule`

`details.rule` is a stable machine code; any other keys in `details` are facts about that rule.
Example (saving an evaluation after the manager submitted the group):

```json
{
  "error": {
    "code": "domain_rule_violated",
    "message": "The evaluation group has been submitted, so evaluations are locked.",
    "details": { "rule": "evaluation_locked" }
  },
  "request_id": "9d4fcc80-1a70-419b-8a9b-e0c02bdf32d6"
}
```

The `message` is already translated and fine to show as is. Use `details.rule` when the UI must
react differently, for example to render the list of group blockers. All rule codes are listed
in [section 10](#10-error-rule-codes).

---

## 5. Concurrency: versions and 409

Records that several people edit carry a version number. Send the version you loaded; if someone
else saved in between, you get **409 `conflict`** and nothing is changed.

| Record | Field in the response | Field you send | Sent on |
|---|---|---|---|
| Plan | `version` | `version` | `PUT plans/{id}/content`, `POST plans/{id}/transitions/{action}` |
| Evaluation | `version` (0 before the first save) | `version` | `PUT plans/{id}/evaluation` |
| Group | `version` | `expected_version` | `POST admin/groups/{id}/approve`, `.../return` |
| Policy | `version_no` | `base_version` | `POST admin/config/policy` |
| Competency template | `version` | `base_version` | `PUT admin/config/competency-templates/{key}` |

A stale version gives:

```json
{
  "error": {
    "code": "conflict",
    "message": "The plan was changed by someone else. Reload it and try again.",
    "details": { "base_version": 1, "current_version": 2 }
  },
  "request_id": "faf9910b-bcd4-4a57-8568-b3003b6b7d14"
}
```

**Do this:** after every successful write, take the new `version` from the response (every write
returns the whole updated record) and use it for the next write. On a 409, keep the user's
unsaved input, show the message with a **Reload** button, and re-fetch the record. Never retry
automatically with the new version: that would overwrite the other person's change.

A 409 can also mean a duplicate. `POST plans` for a member who already has a plan gives
`details: {"rule": "plan_already_exists", "plan_id": 1}`; open that plan instead. Notification
templates have no version: the last write wins.

---

## 6. Units: basis points, dates, times, decimals

**Basis points (bp).** All percentages are integers in basis points: `10000` = 100%, `9220` =
92.2%, `50` = 0.5%. This covers `weight_bp`, `weights_bp`, `threshold_bp`, `bell_min_bp`,
`bell_max_bp`, `achievement_bp`, `objectives_bp`, `competency_bp`, `overall_bp`, `percent_bp`.
Display with `(bp / 100).toFixed(2) + '%'` (or `Intl.NumberFormat` with the user's locale), and
convert an input back with `Math.round(Number(value) * 100)`. Never send fractions of a bp.

**KPI numbers** (`target`, `baseline`, `actual`) are decimal **strings** in responses with four
decimals: `"100000.0000"`. Send plain numbers or numeric strings. Do not do arithmetic on them as
floats if you need exact values; display them with `Number(x)` and the locale formatter. A
percentage target may be at most `max_percentage_target` (1000) from `GET meta/kpi-units`.

**Dates and times.**

- Plain dates are `YYYY-MM-DD` (`start_date`, `deadline_date`, `joining_date`, `as_of`). Treat
  them as calendar dates, not instants: don't pass them through `new Date()` and a time zone.
- Instants are ISO 8601 in UTC: `2026-12-15T21:00:00+00:00`. Display them in the user's zone.
- The business runs in **Riyadh time (UTC+3)**. A stage deadline is a whole day: the stage
  closes at the **cutoff**, midnight Riyadh at the end of the deadline day, which is
  `deadline_date` at 21:00 UTC. Each stage in a cycle carries both: `deadline_date` to show,
  `cutoff_at` to compare with now.

---

## 7. Roles and what each one sees

`GET me` returns three flags: `roles.admin`, `roles.manager` (manages at least one active
employee) and `roles.employee` (has an employee record). A user can have several.
`GET cycles` adds `my_roles` per cycle (`member`, `manager`) for the active cycles the user
takes part in. Use these flags to build the menu; the server still checks every request.

| Area | Admin | Manager | Employee |
|---|---|---|---|
| `admin/*` endpoints | yes | 403 | 403 |
| `employees` | everyone | own active direct reports | 403 |
| `meta/*`, `me`, `me/results`, `cycles` | yes | yes | yes |
| `plans` list | all plans | plans of the employees they currently manage | own plan only |
| Plan content/history | all; sees internal events | own team; sees internal events | own plan; **no internal events**, content only once it reaches them |
| `cycles/{id}/plan-status` | all members | own team | 403 |
| Evaluation (`plans/{id}/evaluation`) | read only | read and write, own team | **403, even on their own plan** |
| `cycles/{id}/team-evaluations`, `cycles/{id}/group` | any manager (pass `manager_id`) | own team | 403 |
| Group submit | — | own group | — |
| Group approve / return | yes | — | — |
| `results` | everyone, incl. unpublished (`published: false`) | published results of people they managed at approval | own published results |

Two rules surprise people:

- **Nobody sees a group or team they belong to**, not even an Admin. An Admin who is also a
  member of a cycle gets 403 on `team-evaluations` and `group` for a team they are in, so an
  employee never sees their own provisional score. An Admin who manages a group can't approve or
  return it either (422 `self_review_forbidden`).
- **Plan actions depend on who wrote the plan.** Use `allowed_actions` on the plan (section 9.6)
  instead of re-implementing the rules.

---

## 8. The business flow in one page

```
Admin sets up         Cycle (draft) ──scope──▶ preview ──activate──▶ Cycle (active), members created
                                                                     │
Goal Setting          Manager (or Admin) writes each member's plan   │  plan workflow:
  (to deadline 1)     draft ─submit─▶ pending_admin ─approve─▶ pending_employee ─employee_approve─▶ approved
                                         │return (with comments)     │request_modification
                                         ▼                           ▼
                                      returned ◀────────────────── returned ──submit──▶ pending_employee
Employee Review       Employee approves or asks for changes (2 requests flag the plan for Admin)
  (to deadline 2)     Members without an approved plan are marked "missed" at the cutoff
Active Performance    Nothing to do in the system; Admin may reopen an approved plan
  (to deadline 3)
Manager Evaluation    Manager enters KPI actuals, competency ratings (1–5), evidence;
  (to deadline 4)     sees the provisional Bell Curve; submits the whole team as one group
Admin Final Review    Admin approves or returns each group (return reopens its evaluations)
  (to deadline 5)     At this cutoff approved results are published to employees and managers
```

Each active cycle has `current_stage`, the stage whose cutoff hasn't passed yet. Stage
deadlines are checked on the server; your UI should still use `cutoff_at` to disable actions
after the deadline and avoid avoidable 422 `stage_closed` errors.

**How a score is calculated** (shown so you can explain numbers, not to re-compute them; always
show the server's values):

- KPI achievement: `actual / target` for `higher` KPIs and `target / actual` for `lower` ones,
  capped at 100% (`achievement_bp`). Weighted by `weight_bp` (KPI weights in a plan total 10000).
- Objectives result `objectives_bp` = sum of weighted achievements.
- Each competency rating 1–5 maps to a percent through the policy's `competency_map_bp`
  (`[5000, 7000, 8500, 9300, 10000]`); `competency_bp` is their average.
- Overall `overall_bp` = objectives × `weights_bp.objectives` + competencies ×
  `weights_bp.competencies` (80/20 in the demo policy).
- The rating level is the highest level whose `threshold_bp` ≤ overall. Levels 4 and 5 need at
  least one evidence file (`requires_evidence`).
- The Bell Curve gives, for a group of N people, a minimum and maximum head count per level
  (`allowed`); a group whose counts fall outside cannot be submitted.

In the demo run, plan A (Yousef) scores 92.2% (level 4, Exceeds Expectations): 100% and 80% on
the two KPIs weighted 60/40 give 92%, competencies all rated 4 give 93%, and
0.8 × 92 + 0.2 × 93 = 92.2.

---

## 9. Endpoint reference

Each entry gives the method and path, who may call it, the body, the response and what can go
wrong. **Role** uses A = Admin, M = Manager, E = Employee, Any = any logged-in user. Long
responses are shortened with `...`; the Postman collection has the full ones.

### 9.1 Auth

#### `POST auth/login` — no token

```json
{ "email": "admin@pmp-demo.test", "password": "password" }
```

200:

```json
{
  "token": "1|Sh0DXnepDx4k68gmctuaVhNH3jjIdDbLa2rTTy3Cd6946693",
  "token_type": "Bearer",
  "expires_at": "2026-11-22T15:25:34+00:00",
  "user": {
    "id": 7,
    "email": "admin@pmp-demo.test",
    "name": "Lina Sample",
    "employee": {
      "id": 7, "jisr_id": "demo-0007", "code": "D0007", "full_name": "Lina Sample",
      "email": "admin@pmp-demo.test", "status": "active", "is_active": true,
      "joining_date": "2016-11-14", "terminate_date": null, "line_manager_id": 2,
      "department": { "id": 6, "type": "department", "jisr_id": "demo-dept-hr", "code": null, "name": "Human Resources" },
      "job_title": { "id": 13, "type": "job_title", "jisr_id": "demo-jt-hr-specialist", "code": null, "name": "HR Specialist" }
    },
    "roles": { "admin": true, "manager": false, "employee": true }
  }
}
```

This response is **not** wrapped in `data`. Note the difference between `user.id` (the login
account; used by admin grants) and `user.employee.id` (the employee record; used everywhere
else: scopes, `manager_id`, overrides). Errors: 422 wrong credentials, 403 inactive employee,
429 rate limit.

#### `POST auth/logout` — Any

No body. 204. The token stops working immediately (next call 401).

### 9.2 Me, meta, employees

#### `GET me` — Any

`{"data": {id, email, name, employee, roles}}`, the same user object as the login response.
Call it on app start when you already hold a token, to restore the session and the roles.

#### `GET meta/kpi-units` — Any

The options for the KPI editor: each measurement type with its allowed units, the directions,
and the cap on percentage targets.

```json
{
  "data": {
    "measurement_types": [
      { "value": "percentage", "label": { "en": "Percentage", "ar": "نسبة مئوية" },
        "units": [ { "value": "percent", "label": { "en": "%", "ar": "٪" } } ] },
      { "value": "number_amount", "label": { "en": "Number / Amount", "ar": "رقم / مبلغ" },
        "units": [ { "value": "count", ... }, { "value": "sar", ... }, { "value": "units", ... },
                   { "value": "accounts", ... }, { "value": "transactions", ... } ] },
      { "value": "duration_time", "label": { "en": "Duration / Time", "ar": "مدة / وقت" },
        "units": [ { "value": "hours", ... }, { "value": "days", ... }, { "value": "minutes", ... },
                   { "value": "weeks", ... } ] }
    ],
    "directions": ["higher", "lower"],
    "max_percentage_target": 1000
  }
}
```

Build the unit dropdown from the selected measurement type; any other unit is refused with
`unit_not_allowed_for_type`.

#### `GET meta/objective-categories` — Any

Active categories, unpaginated: `[{"id": 1, "name": {"ar": "المالية", "en": "Financial"}, "created_at": ..., "updated_at": ...}, ...]`.
Use it for the category dropdown in the plan editor.

#### `GET employees` — A (everyone), M (active direct reports)

Paginated. Filters: `filter[status]`, `filter[is_active]` (1/0), `filter[department_id]`,
`filter[job_title_id]`, `filter[line_manager_id]`, `filter[email]` (partial match),
`filter[code]`. Sort: `sort=id|code|joining_date` (prefix `-` for descending). Employees get 403.

#### `GET employees/{employee}` — A, M (own reports)

```json
{
  "data": {
    "id": 10, "jisr_id": "demo-0010", "code": "D0010", "full_name": "Yousef Demo",
    "email": "yousef.demo@pmp-demo.test", "status": "active", "is_active": true,
    "joining_date": "2017-03-17", "terminate_date": null, "line_manager_id": 3,
    "department":      { "id": 8, "type": "department", "jisr_id": "demo-dept-fin", "code": null, "name": "Finance" },
    "business_unit":   { "id": 2, "type": "business_unit", "jisr_id": "demo-bu-corp", "code": null, "name": "Corporate Services" },
    "location":        { "id": 3, "type": "location", "jisr_id": "demo-loc-ruh", "code": null, "name": "Riyadh Head Office" },
    "job_title":       { "id": 15, "type": "job_title", "jisr_id": "demo-jt-accountant", "code": null, "name": "Accountant" },
    "employment_type": { "id": 5, "type": "employment_type", "jisr_id": "demo-et-full", "code": null, "name": "Full-time" }
  }
}
```

Employee data comes from the Jisr HR system and is read-only here. `full_name` and the lookup
`name`s follow `Accept-Language`.

### 9.3 Configuration (Admin)

All endpoints in this section are Admin-only (others get 403).

#### Policy: weights, rating levels, Bell Curve

`GET admin/config/policy` — the version in force:

```json
{
  "data": {
    "id": 1, "version_no": 1,
    "weights_bp": { "objectives": 8000, "competencies": 2000 },
    "levels": [
      { "level": 1, "label": { "ar": "دون التوقعات", "en": "Below Expectations" }, "threshold_bp": 0,    "bell_min_bp": 0,    "bell_max_bp": 500 },
      { "level": 2, "label": { "ar": "يلبي التوقعات جزئيًا", "en": "Partially Meets Expectations" }, "threshold_bp": 6500, "bell_min_bp": 500,  "bell_max_bp": 1000 },
      { "level": 3, "label": { "ar": "يلبي التوقعات", "en": "Meets Expectations" }, "threshold_bp": 7500, "bell_min_bp": 6000, "bell_max_bp": 7000 },
      { "level": 4, "label": { "ar": "يفوق التوقعات", "en": "Exceeds Expectations" }, "threshold_bp": 9000, "bell_min_bp": 1500, "bell_max_bp": 2000 },
      { "level": 5, "label": { "ar": "متميز", "en": "Outstanding" }, "threshold_bp": 9600, "bell_min_bp": 500,  "bell_max_bp": 1000 }
    ],
    "competency_map_bp": [5000, 7000, 8500, 9300, 10000],
    "created_by": null,
    "created_at": "2026-11-22T09:27:31+00:00"
  }
}
```

`GET admin/config/policy/versions` — every version, newest first, paginated. This is the audit
trail of policy changes.

`POST admin/config/policy/preview` — allowed head counts for some team sizes, from limits not
yet saved. Use it to show a live table while the Admin edits the Bell Curve.

```json
{
  "sizes": [2, 5, 12],
  "levels": [
    { "level": 1, "bell_min_bp": 0,    "bell_max_bp": 500 },
    { "level": 2, "bell_min_bp": 500,  "bell_max_bp": 1000 },
    { "level": 3, "bell_min_bp": 6000, "bell_max_bp": 7000 },
    { "level": 4, "bell_min_bp": 1500, "bell_max_bp": 2000 },
    { "level": 5, "bell_min_bp": 500,  "bell_max_bp": 1000 }
  ]
}
```

200: `{"data": {"sizes": [{"n": 2, "levels": [{"level": 1, "min": 0, "max": 1}, ..., {"level": 3, "min": 1, "max": 2}, ...]}, {"n": 5, ...}, {"n": 12, ...}]}}`.
`sizes`: 1 to 200 integers.

`POST admin/config/policy` — publish a new version (201). Body:

```json
{
  "base_version": 1,
  "weights_bp": { "objectives": 8000, "competencies": 2000 },
  "levels": [
    { "level": 1, "label": { "ar": "دون التوقعات", "en": "Below Expectations" }, "threshold_bp": 0, "bell_min_bp": 0, "bell_max_bp": 500 },
    "... exactly five levels, 1 to 5 ..."
  ]
}
```

Rules (each a 422 with the `details.rule` shown): weights add up to 10000 (`weights_sum`);
level 1 threshold is 0 (`first_threshold_zero`); thresholds strictly increase
(`thresholds_increasing`); each `bell_min_bp` ≤ `bell_max_bp` (`bell_min_above_max`); the mins
add up to at most 10000 (`bell_min_sum`) and the maxes to at least 10000 (`bell_max_sum`).
`base_version` not current → 409. New versions apply to cycles activated afterwards; an active
cycle keeps the version it pinned at activation.

#### Competency templates

A template is a set of competency groups, each with competencies, attached to job titles. Every
member of a cycle is rated on the template of their job title, pinned at activation. Templates
are identified by `lineage_key` (a ULID that stays the same across versions); `id` changes with
every version.

- `GET admin/config/competency-templates` — current version of each, with `job_titles`.
- `GET admin/config/job-titles/unassigned` — job titles with no template. Employees with such a
  job title are not included in a cycle (`no_competency_template`).
- `POST admin/config/competency-templates` (201) — create as version 1:

```json
{
  "name": { "ar": "علوم البيانات", "en": "Data Science" },
  "groups": [
    {
      "name": { "ar": "الجدارات التقنية", "en": "Technical competencies" },
      "competencies": [
        { "name": { "ar": "تحليل البيانات", "en": "Data analysis" },
          "description": { "ar": "يحلل البيانات ويستخلص نتائج صحيحة.", "en": "Analyses data and draws sound conclusions." } },
        { "name": { "ar": "التواصل", "en": "Communication" },
          "description": { "ar": "يشرح النتائج بوضوح لغير المختصين.", "en": "Explains findings clearly to non-specialists." } }
      ]
    }
  ]
}
```

  Response: `{"data": {"id", "lineage_key", "version": 1, "name", "is_current": true, "groups": [...], "job_titles": [], ...}}`.

- `GET admin/config/competency-templates/{key}` — one template with groups and competencies.
- `PUT admin/config/competency-templates/{key}` — replace the whole template as a new version.
  Same body plus `"base_version": <current version>`. Older versions stay unchanged (cycles that
  pinned them keep them). Stale `base_version` → 409.
- `GET admin/config/competency-templates/{key}/versions` — all versions, newest first.
- `PUT admin/config/competency-templates/{key}/job-titles` — replace the attached job titles:
  `{"job_title_ids": [17]}`. A job title can belong to one template only; one already used
  elsewhere is a 422 on `job_title_ids.N`.
- `DELETE admin/config/competency-templates/{key}` — 204; soft-deletes all versions and frees the
  job titles.

#### Objective categories

- `GET admin/config/objective-categories` — paginated, active only.
- `POST admin/config/objective-categories` (201): `{"name": {"ar": "الاستدامة", "en": "Sustainability"}}`.
  Each name must be unused among active categories in its language (422 on `name.en`/`name.ar`).
- `PATCH admin/config/objective-categories/{id}` — rename one or both languages:
  `{"name": {"en": "Sustainability and ESG"}}`.
- `DELETE admin/config/objective-categories/{id}` — 204, soft delete. Existing plans keep showing
  the category name; it can no longer be chosen (`category_inactive`).

#### Email templates (notifications)

22 templates identified by `code` (`NOT-001` ... `NOT-022`). `NOT-018` to `NOT-021` have
`in_use: false` (not sent by the system yet).

- `GET admin/config/notification-templates` — all, with `code`, `name`, `recipient`, `trigger`, `in_use`.
- `GET admin/config/notification-templates/{code}` — one, with the texts and the allowed
  placeholders per language.
- `PUT admin/config/notification-templates/{code}` — replace subject and body in both languages:

```json
{
  "subject": { "ar": "تفعيل دورة الأداء [اسم الدورة]", "en": "Performance cycle [Cycle Name] is active" },
  "body": {
    "ar": "عزيزي/عزيزتي [اسم المدير]،\nتم تفعيل دورة الأداء [اسم الدورة] لعام [سنة الأداء]. يرجى البدء في تخطيط الأداء لفريقك.\nفريق إدارة الأداء.",
    "en": "Dear [Manager Name],\nPerformance cycle [Cycle Name] for [Performance Year] is now active. Please start planning your team's goals.\nTalent Management Team."
  }
}
```

  200:

```json
{
  "data": {
    "code": "NOT-001", "uc": "UC-006",
    "name": { "ar": "تفعيل دورة إدارة الأداء", "en": "Performance Cycle Activation" },
    "recipient": "Manager", "trigger": "Cycle activated", "in_use": true,
    "subject": { "ar": "...", "en": "..." }, "body": { "ar": "...", "en": "..." },
    "placeholders": {
      "en": ["Recipient Name", "Manager Name", "Cycle Name", "Cycle / Period", "Performance Year"],
      "ar": ["اسم المستلم", "اسم المدير", "اسم الدورة", "الدورة / الفترة", "سنة الأداء"]
    },
    "updated_by": { "id": 7, "name": "Lina Sample" },
    "updated_at": "2026-11-22T11:25:38+00:00"
  }
}
```

  Placeholders are written in square brackets and must come from `placeholders` for that
  language (Arabic placeholders in the Arabic text). An unknown one is a 422 on the exact field
  (`subject.en`, `body.ar`, ...). Subject max 255 characters, body max 5000. Bodies are plain
  text; `\n` is a line break. No version: the last write wins, and the change applies to emails
  sent from now on.

### 9.4 Eligibility (Admin)

Who a cycle includes is decided per employee, in this order: an override for this cycle, a
global override, the first matching active exclusion rule (lowest id wins), then the default rule
(at least six months of service on the reference date, and a job title with a competency
template). Employees added to a cycle's scope by name are `manual`.

- `GET admin/eligibility/exclusion-categories` — the seeded categories (read-only):
  `[{"id": 1, "key": "terminated", "name": {...}}, {"id": 2, "key": "tamheer", ...}, ...]`.
- `GET admin/eligibility/attributes` — what a rule can match, for the rule form:

```json
{
  "data": [
    { "key": "department", "label": { "en": "Department", "ar": "الإدارة" }, "kind": "lookup",
      "values": [ { "id": 8, "name": { "ar": "المالية", "en": "Finance" } }, "..." ] },
    { "key": "business_unit", "...": "..." }, { "key": "location", "...": "..." },
    { "key": "job_title", "...": "..." }, { "key": "employment_type", "...": "..." },
    { "key": "custom_field", "kind": "custom_field", "fields": [ "... known Jisr custom fields ..." ] }
  ]
}
```

- `GET admin/eligibility/exclusion-rules` — paginated, active and inactive, oldest first.
- `POST admin/eligibility/exclusion-rules` (201). For a lookup attribute:

```json
{ "attribute": "employment_type", "lookup_id": 5, "category_id": 1, "active": true }
```

  For `custom_field`: `{"attribute": "custom_field", "custom_field_id": <id>, "match_value": "<text>", "category_id": <id>}`.
  Response:

```json
{
  "data": {
    "id": 2, "attribute": "employment_type",
    "lookup": { "id": 5, "name": { "ar": "دوام كامل", "en": "Full-time" } },
    "custom_field": null, "match_value": null,
    "category": { "id": 1, "key": "terminated", "name": { "ar": "منتهية خدمته", "en": "Terminated" } },
    "active": true, "created_at": "...", "updated_at": "..."
  }
}
```

  An exact duplicate of an active rule → 409.
- `PATCH admin/eligibility/exclusion-rules/{rule}` — same fields; send `{"active": false}` to
  stop a rule matching without deleting it.
- `DELETE admin/eligibility/exclusion-rules/{rule}` — 204, permanent.
- `GET admin/eligibility/overrides` — paginated, newest first.
- `POST admin/eligibility/overrides` (201) — force one employee in or out, globally (no
  `cycle_id`) or for one **draft** cycle:

```json
{ "employee_id": 33, "action": "exclude", "reason": "Seconded to a partner entity for this cycle.", "cycle_id": 1 }
```

  `action`: `include` or `exclude`. One override per employee and cycle (or one global).
  Response: `{"data": {"id": 2, "employee": {"id": 33, "code": "D0033", "name": {"ar": ..., "en": ...}}, "cycle_id": 1, "action": "exclude", "reason": "...", "set_by": 7, "created_at": "..."}}`.
- `DELETE admin/eligibility/overrides/{override}` — 204. A cycle override can be removed only
  while its cycle is a draft.
- `GET admin/eligibility/employees/{employee}/eligibility?as_of=YYYY-MM-DD` — why one employee
  is or isn't eligible (outside any cycle; `as_of` defaults to today in Riyadh):
  `{"data": {"as_of": "2026-11-22", "employee_id": 10, "name": {...}, "status": "included", "eligibility_source": "default", "reason": []}}`.

**Eligibility statuses** (used here, in the cycle preview and the activation report):
`included`, `excluded_override`, `excluded_rule`, `excluded_manual`, `under_6_months`,
`joining_date_missing`, `no_competency_template`, `terminated`, `in_other_active_cycle`.
`reason` holds the facts for the status, for example
`{"joining_date": "2026-09-01", "eligible_from": "2027-03-01"}` for `under_6_months`, or
`{"category": "contractor", "category_name": {...}, "rule_id": 1}` for `excluded_rule`. It is an
empty array `[]` (not an object) when there is nothing to add; handle both.

### 9.5 Cycles

A cycle runs one performance year in five stages. It is created as a **draft**, scoped, then
**activated** (the members are created and the policy and template versions pinned). After the
Admin Final Review cutoff and the end date it becomes **closed**.

#### `POST admin/cycles` — A (201)

```json
{
  "name": { "ar": "دورة الأداء السنوية", "en": "Annual Performance Cycle" },
  "performance_year": 2026,
  "start_date": "2026-11-01",
  "stages": {
    "goal_setting": "2026-12-15",
    "employee_review": "2026-12-31",
    "active_performance": "2027-06-30",
    "manager_evaluation": "2027-08-31",
    "admin_final_review": "2027-09-30"
  }
}
```

The end date is calculated: start date + 1 year − 1 day. Rules: `performance_year` is the start
date's year or the next (`performance_year_out_of_range`); the five deadlines are in this order
(`deadlines_out_of_order`) and inside the cycle dates (`deadline_outside_cycle`); no deadline in
the past (`deadline_in_past`). Response:

```json
{
  "data": {
    "id": 2,
    "name": { "ar": "دورة الأداء السنوية", "en": "Annual Performance Cycle" },
    "performance_year": 2026, "start_date": "2026-11-01", "end_date": "2027-10-31",
    "status": "draft", "policy_version_id": null,
    "activated_at": null, "activated_by": null, "closed_at": null,
    "current_stage": "goal_setting",
    "stages": [
      { "stage": "goal_setting", "position": 1, "deadline_date": "2026-12-15", "cutoff_at": "2026-12-15T21:00:00+00:00", "processed_at": null },
      { "stage": "employee_review", "position": 2, "deadline_date": "2026-12-31", "cutoff_at": "2026-12-31T21:00:00+00:00", "processed_at": null },
      { "stage": "active_performance", "position": 3, "deadline_date": "2027-06-30", "cutoff_at": "2027-06-30T21:00:00+00:00", "processed_at": null },
      { "stage": "manager_evaluation", "position": 4, "deadline_date": "2027-08-31", "cutoff_at": "2027-08-31T21:00:00+00:00", "processed_at": null },
      { "stage": "admin_final_review", "position": 5, "deadline_date": "2027-09-30", "cutoff_at": "2027-09-30T21:00:00+00:00", "processed_at": null }
    ],
    "created_at": "2026-11-22T11:25:40+00:00",
    "updated_at": "2026-11-22T11:25:40+00:00"
  }
}
```

`processed_at` is set once the server has run that stage's deadline jobs (marking missed
members, publishing results).

#### Draft-only changes — A

- `PATCH admin/cycles/{cycle}` — any field of the create body, all optional; `stages` may hold
  only the deadlines that change: `{"stages": {"admin_final_review": "2027-09-30"}}`.
  On a non-draft cycle: 422 `cycle_not_draft`.
- `PUT admin/cycles/{cycle}/scope` — replace the whole scope. All four arrays are required (they
  may be empty). Department and job-title ids are org lookup ids, employee ids are employee ids:

```json
{ "departments": [], "job_titles": [], "employees": [10, 11, 33], "excluded_employees": [] }
```

  The scope is departments ∪ job titles ∪ named employees, minus `excluded_employees`.
- `GET admin/cycles/{cycle}/preview?as_of=YYYY-MM-DD` — who would be included, with a status
  and reason each (advisory: activation resolves again):

```json
{
  "data": {
    "as_of": "2026-11-22",
    "summary": { "included": 3 },
    "candidates": [
      { "employee_id": 10, "name": { "ar": "يوسف التوضيحي", "en": "Yousef Demo" }, "status": "included", "eligibility_source": "manual", "reason": [] },
      "..."
    ]
  }
}
```

- `DELETE admin/cycles/{cycle}` — 204, hard delete.

#### `POST admin/cycles/{cycle}/activate` — A

No body. Returns the cycle (now `active`, with `policy_version_id`) and the activation report:

```json
{
  "data": { "id": 2, "status": "active", "policy_version_id": 2, "...": "..." },
  "meta": { "activation": { "as_of": "2026-11-22", "included_count": 3, "not_included": [] } }
}
```

`not_included` lists each employee in scope who wasn't included, with `status` and `reason` as in
the preview. Show it to the Admin after activating. Errors: `goal_setting_cutoff_passed`,
`no_eligible_employees`, `no_policy_version`, `cycle_not_draft`. Activation sends the
"cycle activated" email to managers.

#### Reading cycles

- `GET admin/cycles` — A, paginated, newest first. Filters `filter[status]=draft|active|closed`,
  `filter[performance_year]`.
- `GET admin/cycles/{cycle}` — A.
- `GET cycles` — Any. The active cycles the user takes part in (Admin: all active cycles), each
  with the cycle fields plus `my_roles: {"member": bool, "manager": bool}`. Use it for the cycle
  switcher and to decide which screens a user gets in each cycle.

#### `PATCH admin/cycles/{cycle}/stages/{stage}` — A

Change one deadline: `{"deadline_date": "2027-09-30"}`. `{stage}` is one of `goal_setting`,
`employee_review`, `active_performance`, `manager_evaluation`, `admin_final_review`. On an active
cycle only the current and later stages can move (`stage_closed` otherwise); order and range
rules apply as on create.

#### Members — A

- `GET admin/cycles/{cycle}/members` — paginated. `status=active|removed|missed`,
  `filter[department_id]`, `filter[manager_id]` (current manager's employee id),
  `filter[employee_id]`.

```json
{
  "data": [
    {
      "id": 1, "cycle_id": 2,
      "employee": { "id": 10, "code": "D0010", "name": "Yousef Demo", "department_id": 8 },
      "status": "active", "job_title_id": 15, "template_version_id": 2,
      "manager_id_at_activation": 3, "current_manager_id": 3,
      "eligibility_source": "manual", "missed_stage": null,
      "removed_at": null, "removed_by": null, "removal_reason": null
    }
  ],
  "links": { "...": "..." }, "meta": { "...": "..." }
}
```

  `id` here is the **cycle member id** (used to create plans and in group returns), not the
  employee id.
- `DELETE admin/cycles/{cycle}/members/{employee}?reason=...` — remove an employee from an active
  cycle. `{employee}` is the **employee id**; the reason goes in the **query string** (max 2000
  characters), URL-encoded. Returns the member with `status: "removed"`. The row is kept as
  history. Already removed → `member_already_removed`.

#### `GET cycles/{cycle}/plan-status` — A (all members), M (own team)

Every active member with their plan's display status, including members with no plan yet. Filter
`status=<display status>`. Slim pagination `meta` (section 3).

```json
{
  "data": [
    { "cycle_member_id": 1, "employee": { "id": 10, "code": "D0010", "name": "Yousef Demo" },
      "current_manager_id": 3, "plan_id": null, "display_status": "not_started",
      "requires_admin_attention": false }
  ],
  "meta": { "current_page": 1, "per_page": 25, "total": 2, "last_page": 1 }
}
```

Display statuses: `not_started`, `draft`, `pending_admin_approval`, `returned_to_manager`,
`pending_employee_review`, `goals_approved`. A member with `plan_id: null` needs
`POST plans` with their `cycle_member_id`.

### 9.6 Plans

A plan holds a member's objectives, each with one or more KPIs. It is written by the member's
current manager (`author_role: "manager"`) or by an Admin (`author_role: "admin"`), and approved
by the employee.

#### Statuses and actions

| Stored `status` | `display_status` | Meaning |
|---|---|---|
| `draft` | `draft` | Being written |
| `pending_admin` | `pending_admin_approval` | A manager submitted it; Admin reviews |
| `returned` | `returned_to_manager` | Back with the author (see `return_source`) |
| `pending_employee` | `pending_employee_review` | The employee reviews it |
| `approved` | `goals_approved` | The employee approved it |

`return_source` tells why a plan is `returned`: `admin` (Admin returned it), `employee` (the
employee asked for changes) or `admin_reopen` (Admin reopened an approved plan).

| Action (`{action}`) | Who | From → to | Body besides `version` |
|---|---|---|---|
| (save content) | author; Admin also in `pending_admin` | draft, returned, pending_admin (no change) | the tree (`PUT .../content`) |
| `submit` | author | draft → pending_admin (manager-authored) or pending_employee (Admin-authored); returned → pending_admin if Admin returned it, otherwise → pending_employee | `comment?` |
| `approve` | Admin | pending_admin → pending_employee | `comment?` |
| `return` | Admin | pending_admin → returned | `comment?`, `comments[]` with **at least one** on an objective or KPI |
| `employee_approve` | the employee | pending_employee → approved | `comment?` |
| `request_modification` | the employee | pending_employee → returned | `comment` **required** |
| `attention_comment` | Admin, only when `requires_admin_attention` | any → same | `comment` **required** |
| `reopen` | Admin | approved → returned | `reason` **required** |
| (delete) | author | draft → gone (`DELETE plans/{id}`) | — |

**Don't rebuild this table in the UI.** Every plan response includes `allowed_actions`, the
actions the current user may take right now (state, role, authorship and deadlines checked).
Show a button for each entry: `edit_content`, `delete`, `submit`, `approve`, `return`,
`employee_approve`, `request_modification`, `attention_comment`, `reopen`.

The second `request_modification` sets `requires_admin_attention: true` (it is computed as
`mod_requests >= 2` and never resets). Admins find these plans with
`GET plans?filter[requires_admin_attention]=1`.

**Deadlines:** writing, submitting, approving and returning close at the Goal Setting cutoff; the
employee loop (`pending_employee`, and `returned` after an employee request) closes at the
Employee Review cutoff. A reopened plan can be worked on until Manager Evaluation starts. Reopen
itself is refused once Manager Evaluation has started (`reopen_after_evaluation_started`).
`attention_comment` has no deadline.

#### `POST plans` — M (current manager), A — 201

`{"cycle_member_id": 1}`. Only while Goal Setting is open. Response (an empty draft):

```json
{
  "data": {
    "id": 1, "cycle_id": 2, "cycle_member_id": 1,
    "employee": { "id": 10, "code": "D0010", "name": "Yousef Demo" },
    "current_manager_id": 3,
    "status": "draft", "display_status": "draft", "return_source": null,
    "author_role": "manager", "created_by": 3,
    "reopened_at": null, "reopen_reason": null,
    "mod_requests": 0, "requires_admin_attention": false, "approved_snapshot_id": null,
    "version": 1,
    "created_at": "2026-11-22T11:25:41+00:00", "updated_at": "2026-11-22T11:25:41+00:00",
    "content_visible": true, "weights_total_bp": 0,
    "objectives": [],
    "allowed_actions": ["edit_content", "delete", "submit"],
    "open_comments": null
  }
}
```

A second plan for the same member → 409 `plan_already_exists` with `plan_id`.

#### `PUT plans/{plan}/content` — author (and Admin while `pending_admin`)

Saves the **whole** tree. Rows are matched by `id`: send `id` to keep (and update) an existing
objective or KPI, leave it out to create one, and leave a row out of the array to delete it.

```json
{
  "version": 1,
  "objectives": [
    {
      "category_id": 1,
      "text": "Deliver the yearly cost-saving programme",
      "kpis": [
        { "name": "Cost savings delivered", "measurement_type": "number_amount", "unit": "sar",
          "direction": "higher", "target": 100000, "baseline": 80000, "weight_bp": 6000 }
      ]
    },
    {
      "category_id": 2,
      "text": "Resolve customer tickets faster",
      "kpis": [
        { "name": "Average ticket resolution time", "measurement_type": "duration_time", "unit": "hours",
          "direction": "lower", "target": 8.0, "baseline": null, "weight_bp": 4000 }
      ]
    }
  ]
}
```

To edit the same plan later, include the ids from the last response:

```json
{ "version": 4, "objectives": [ { "id": 1, "category_id": 1, "text": "...", "kpis": [ { "id": 1, "name": "...", "...": "..." } ] }, "..." ] }
```

Response: the whole plan with the new `version` and ids:

```json
{
  "data": {
    "id": 1, "status": "draft", "version": 2, "weights_total_bp": 10000,
    "objectives": [
      {
        "id": 1, "category_id": 1, "category_name": { "ar": "المالية", "en": "Financial" },
        "text": "Deliver the yearly cost-saving programme", "position": 1,
        "kpis": [
          { "id": 1, "name": "Cost savings delivered", "measurement_type": "number_amount", "unit": "sar",
            "direction": "higher", "target": "100000.0000", "baseline": "80000.0000",
            "weight_bp": 6000, "smart_score": null, "position": 1 }
        ]
      },
      "..."
    ],
    "allowed_actions": ["edit_content", "delete", "submit"],
    "...": "..."
  }
}
```

Saving an incomplete tree is allowed (a draft can be at 70%); `weights_total_bp` tells you the
current total. **Submitting** checks completeness: at least one objective (`no_objectives`), a
KPI under each objective (`objective_without_kpi`), KPI weights totalling 10000 (`weights_sum`),
each unit allowed for its type (`unit_not_allowed_for_type`), active categories
(`category_inactive`). Field errors come back on paths like `objectives.1.kpis.0.weight_bp`.
Order follows the array order (`position` is assigned by the server).

#### `POST plans/{plan}/transitions/{action}`

```json
{ "version": 3 }
```

```json
{
  "version": 3,
  "comment": "Please make the second target more ambitious.",
  "comments": [ { "target": "kpi", "id": 2, "body": "8 hours is the current average; aim lower." } ]
}
```

```json
{ "version": 13, "reason": "The team changed scope in the first quarter." }
```

`comments[].target` is `plan`, `objective` or `kpi`; `id` is required unless the target is
`plan`, and must belong to this plan. `comment` is a plan-level comment. Each call returns the
whole plan with the new `status`, `version` and `allowed_actions`.

Errors: 403 when the user's role can never take the action; 422 `invalid_transition` (wrong
status, with `details.action`, `status`, `return_source`), `not_plan_author`, `content_locked`,
`stage_closed`, `return_requires_comment`, `reopen_after_evaluation_started`; 422 on `comment` or
`reason` when required and empty; 409 stale version.

#### Reading plans

- `GET plans` — Any, paginated, scoped by role. Filters: `filter[cycle_id]`, `filter[status]`
  (stored status), `filter[requires_admin_attention]` (1/0), `filter[employee_id]`.
- `GET plans/{plan}` — the plan with its tree, `allowed_actions` and `open_comments`.
  `open_comments` is the latest return or modification request that is still unanswered:

```json
{
  "open_comments": {
    "event_id": 38, "action": "plan_returned", "return_source": "admin",
    "actor_id": 7, "actor": { "id": 7, "name": "Lina Sample" },
    "created_at": "2026-11-22T11:25:42+00:00",
    "comments": [
      { "id": null, "body": "Please make the second target more ambitious.", "target": "plan" },
      { "id": 2, "body": "8 hours is the current average; aim lower.", "target": "kpi" }
    ]
  }
}
```

  Show each comment next to its objective or KPI (match `target` + `id`) in the editor.
  `content_visible: false` means the user may see that the plan exists but not its content yet
  (an employee before the plan reaches them): `objectives` and `weights_total_bp` are then
  `null`.
- `GET plans/{plan}/history` — workflow events, oldest first:

```json
{
  "data": [
    { "id": 35, "action": "plan_created", "from": null, "to": "draft", "actor_id": 3,
      "actor": { "id": 3, "name": "Faisal Placeholder" }, "comment": null, "comments": [],
      "return_source": null, "plan_version": null, "created_at": "2026-11-22T11:25:41+00:00" },
    { "id": 38, "action": "plan_returned", "from": "pending_admin", "to": "returned", "actor_id": 7,
      "actor": { "id": 7, "name": "Lina Sample" },
      "comment": "Please make the second target more ambitious.",
      "comments": [ { "id": null, "body": "...", "target": "plan" }, { "id": 2, "body": "...", "target": "kpi" } ],
      "return_source": "admin", "plan_version": 4, "created_at": "2026-11-22T11:25:42+00:00" }
  ]
}
```

  Actions: `plan_created`, `plan_content_saved`, `plan_submitted`, `plan_approved_by_admin`,
  `plan_returned`, `plan_approved_by_employee`, `plan_modification_requested`,
  `plan_attention_comment`, `plan_reopened`, and others the server may add (show unknown ones
  generically). The employee doesn't get internal events (Admin review steps).
- `GET plans/{plan}/snapshots` — immutable copies of the tree taken at submit and approval
  (`reason`: `submit`, `employee_approved`, ...), each with `plan_version`, `workflow_event_id`,
  `created_by_name` and the whole `objectives` tree. Use them for "what did the plan look like
  when it was approved".

#### `DELETE plans/{plan}` — author, draft only

204.

### 9.7 Evaluation and evidence

During **Manager Evaluation** the current manager evaluates each member whose plan is approved:
an actual value per KPI and a rating from 1 to 5 per competency. An Admin can read evaluations
but not write them. **The employee gets 403** on their own evaluation (they only see the final
result once published).

#### `GET plans/{plan}/evaluation` — M (current manager), A

```json
{
  "data": {
    "plan_id": 1, "cycle_member_id": 1, "evaluation_id": 1,
    "version": 2,
    "evaluable": true,
    "editable": true,
    "is_complete": true,
    "objectives_bp": 9200, "competency_bp": 9300, "overall_bp": 9220,
    "rating": { "level": 4, "label": { "ar": "يفوق التوقعات", "en": "Exceeds Expectations" } },
    "requires_evidence": true,
    "weights_bp": { "objectives": 8000, "competencies": 2000 },
    "provenance": { "policy_version_id": 2, "snapshot_id": 8, "template_version_id": 2 },
    "kpis": [
      {
        "plan_kpi_id": 1, "objective_id": 1,
        "objective_text": "Deliver the yearly cost-saving programme",
        "category_name": { "ar": "المالية", "en": "Financial" },
        "name": "Cost savings delivered", "measurement_type": "number_amount", "unit": "sar",
        "direction": "higher", "target": "100000.0000", "weight_bp": 6000,
        "actual": "100000.0000", "comment": "Programme fully delivered.",
        "achievement_bp": 10000, "weighted_bp": 6000,
        "evidence": []
      },
      {
        "plan_kpi_id": 2, "...": "...", "direction": "lower", "target": "8.0000", "weight_bp": 4000,
        "actual": "10.0000", "comment": null, "achievement_bp": 8000, "weighted_bp": 3200, "evidence": []
      }
    ],
    "competencies": [
      { "id": 5, "group_id": 3, "group_name": { "ar": "التعاون", "en": "Collaboration" },
        "name": { "ar": "العمل الجماعي", "en": "Teamwork" },
        "description": { "ar": "...", "en": "Works well with colleagues across teams." },
        "rating": 4, "percent_bp": 9300 },
      "..."
    ]
  }
}
```

- `version` is 0 and `evaluation_id` null before the first save.
- `evaluable: false` means the member can't be evaluated (no approved plan, missed or removed).
- `editable` is true only for the current manager, while Manager Evaluation is open and the group
  isn't submitted (or after a group return). Make the form read-only when it is false.
- Until every KPI has an actual and every competency a rating, `is_complete` is false and the
  result fields (`overall_bp`, `rating`, ...) are `null`. Per-KPI `achievement_bp` appears as
  soon as that KPI has an actual.
- `requires_evidence` is true when the rating is 4 or 5 and no file is attached yet. It blocks
  group submission (not saving).
- KPIs come from the approved snapshot of the plan (`provenance.snapshot_id`), competencies from
  the member's pinned template version.

#### `PUT plans/{plan}/evaluation` — M (current manager)

A **partial upsert**: send only what changed. A KPI or competency you leave out keeps its value;
send `null` to clear one.

```json
{
  "version": 0,
  "kpis": [ { "plan_kpi_id": 1, "actual": 100000, "comment": "Programme fully delivered." } ]
}
```

```json
{
  "version": 1,
  "kpis": [ { "plan_kpi_id": 2, "actual": 10 } ],
  "competencies": [
    { "competency_id": 5, "rating": 4 }, { "competency_id": 6, "rating": 4 },
    { "competency_id": 7, "rating": 4 }, { "competency_id": 8, "rating": 4 }
  ]
}
```

Returns the whole evaluation with the new `version` and recalculated results. Within a KPI
object, a key you leave out is unchanged too (send `"comment": null` to clear only the comment).
`rating` must be 1–5 or null.

Errors: 409 stale version; 422 `evaluation_not_open` (outside Manager Evaluation),
`evaluation_locked` (group submitted, `pending_admin` or `approved`), `plan_not_evaluable`,
`evaluation_must_stay_complete` (after a group return you cannot clear values), 403 for anyone
but the current manager.

#### Evidence

`POST plans/{plan}/evaluation/kpis/{kpi}/evidence` — M (current manager), **multipart/form-data**
with one field `file`. `{kpi}` is the `plan_kpi_id`. Allowed: PDF, JPG/PNG, Word, Excel,
PowerPoint; at most **10 MB** per file and **5 files per KPI** (`evidence_limit_reached`). Same
window as saving; the evaluation `version` doesn't change. 201 with the whole evaluation; the new
file is in that KPI's `evidence`:

```json
{ "id": 1, "original_name": "sample-evidence.pdf", "mime": "application/pdf", "size": 606,
  "uploaded_by": 3, "created_at": "2026-11-22T11:25:46+00:00" }
```

```js
const form = new FormData()
form.append('file', fileInput.files[0])
await fetch(`${base}/plans/${planId}/evaluation/kpis/${kpiId}/evidence`, {
  method: 'POST',
  headers: { Accept: 'application/json', Authorization: `Bearer ${token}` }, // no Content-Type: the browser sets the boundary
  body: form,
})
```

A wrong type or size is 422 on `file`.

`GET plans/{plan}/evaluation/evidence/{evidence}` — M, A. Streams the file with
`Content-Type` (e.g. `application/pdf`) and
`Content-Disposition: attachment; filename=sample-evidence.pdf`. Because it needs the Bearer
header, a plain `<a href>` won't work; fetch it as a blob and save it:

```js
const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
if (!res.ok) throw await res.json()
const blob = await res.blob()
const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: evidence.original_name })
a.click()
URL.revokeObjectURL(a.href)
```

`DELETE plans/{plan}/evaluation/evidence/{evidence}` — M (current manager), same window. 200 with
the evaluation without the file.

#### `GET cycles/{cycle}/team-evaluations` — M (own team), A (`manager_id=<employee id>`)

The manager's evaluation dashboard: one row per member and the provisional Bell Curve.

```json
{
  "manager_id": 3,
  "data": [
    { "cycle_member_id": 1, "employee": { "id": 10, "code": "D0010", "name": "Yousef Demo" },
      "plan_id": 1, "evaluable": true, "status": "complete",
      "objectives_bp": 9200, "competency_bp": 9300, "overall_bp": 9220,
      "rating_level": 4, "rating_label": { "ar": "يفوق التوقعات", "en": "Exceeds Expectations" },
      "requires_evidence": false },
    "..."
  ],
  "bell_curve": {
    "n": 2, "policy_version_id": 2,
    "levels": [
      { "level": 1, "min": 0, "max": 1, "label": { "...": "..." }, "count": 0 },
      { "level": 3, "min": 1, "max": 2, "label": { "...": "..." }, "count": 1 },
      { "level": 4, "min": 0, "max": 1, "label": { "...": "..." }, "count": 1 },
      "..."
    ],
    "rated": 2, "unrated": 0
  }
}
```

Row `status`: `not_started`, `draft`, `complete`, `missed`, `removed`. `n` counts active
members; `count` only complete evaluations; `unrated` = active members without a complete
evaluation. The curve is information only here; it is enforced at group submit.

### 9.8 Groups and final review

A **group** is one manager's team in one cycle. The manager submits the whole group at once;
Admin approves or returns the whole group.

| `status` | Meaning |
|---|---|
| `open` | Not submitted yet (`group_id` and `version` are null until the first submit) |
| `pending_admin` | Submitted; evaluations locked; Admin reviews |
| `returned` | Admin returned it; evaluations editable again |
| `approved` | Final; results written, published at the Admin Final Review cutoff |
| `no_manager` | (admin list only) active members with no current manager |

#### `GET cycles/{cycle}/group` — M (own), A (`manager_id=<employee id>`)

```json
{
  "data": {
    "cycle_id": 2, "manager_id": 3, "group_id": null, "status": "open", "version": null,
    "n": 2,
    "counts": { "1": 0, "2": 0, "3": 1, "4": 1, "5": 0 },
    "allowed": [ { "level": 1, "min": 0, "max": 1 }, { "level": 3, "min": 1, "max": 2 }, "..." ],
    "can_submit": true,
    "blockers": [],
    "latest_submission_no": null, "submitted_at": null,
    "return_reason": null, "affected_member_ids": [], "approved_at": null
  }
}
```

`counts` is an object keyed by level ("1" to "5"); `allowed` is an array. `blockers` lists
everything that stops a submit right now (see below), so you can show them before the manager
clicks. `can_submit` combines blockers, status and the stage window.

#### `POST cycles/{cycle}/group/submit` — M (own group)

No body. 200 with the same shape, now `status: "pending_admin"`, `group_id`, `version`,
`latest_submission_no`. If anything blocks, all blockers come back in one 422:

```json
{
  "error": {
    "code": "domain_rule_violated",
    "message": "...",
    "details": {
      "rule": "group_not_submittable",
      "blockers": [
        { "code": "evaluations_incomplete", "member_ids": [2] },
        { "code": "evidence_required", "member_ids": [1] },
        { "code": "bell_curve_violation", "n": 5, "counts": { "1": 0, "2": 0, "3": 2, "4": 3, "5": 0 },
          "allowed": [ "..." ], "violations": [ "... levels outside min/max ..." ] }
      ]
    }
  },
  "request_id": "..."
}
```

Blocker codes: `group_empty`, `evaluations_incomplete` (`member_ids`), `evidence_required`
(`member_ids`), `bell_curve_violation` (`n`, `counts`, `allowed`, `violations`). `member_ids` are
cycle member ids. The Bell Curve is only checked when every evaluation is complete. A group that
is already `pending_admin` or `approved` gives the same rule with `details.status` and empty
`blockers`. Before Manager Evaluation starts, or after its cutoff, submit is 422 `stage_closed`.

#### Admin review — A

- `GET admin/cycles/{cycle}/groups?status=...` — every group of the cycle, including `open` ones
  derived from the active members and a `no_manager` row.
- `GET admin/groups/{group}` — the latest submission:

```json
{
  "data": {
    "id": 1,
    "cycle": { "id": 2, "name": { "...": "..." }, "performance_year": 2026 },
    "manager": { "id": 3, "code": "D0003", "name": "Faisal Placeholder" },
    "status": "pending_admin", "version": 1, "latest_submission_no": 1,
    "policy_version_id": 2, "n": 2,
    "submitted_at": "2027-07-02T11:25:48+00:00",
    "return_reason": null, "affected_member_ids": [], "approved_at": null, "published_at": null,
    "members": [
      { "cycle_member_id": 1, "employee": { "id": 10, "code": "D0010", "name": "Yousef Demo" },
        "plan_id": 1, "evaluation_id": 1, "evaluation_version": 2,
        "objectives_bp": 9200, "competency_bp": 9300, "overall_bp": 9220,
        "rating_level": 4, "rating_label": { "...": "..." } },
      "..."
    ],
    "bell_curve": { "levels": [ { "level": 1, "min": 0, "max": 1, "label": { "...": "..." }, "bell_min_bp": 0, "bell_max_bp": 500, "count": 0 }, "..." ] },
    "history": [
      { "action": "group_submitted", "from_state": "open", "to_state": "pending_admin", "actor_id": 3,
        "comment": null, "payload": { "n": 2, "items": [ "... members with overall_bp, rating_level ..." ], "counts": { "...": 0 } } },
      "..."
    ]
  }
}
```

  Members are sorted by exact overall score, highest first. Open a member's evaluation with
  `GET plans/{plan_id}/evaluation`.
- `POST admin/groups/{group}/return`:

```json
{
  "expected_version": 1,
  "reason": "Please double-check Maha's resolution-time actual.",
  "affected_member_ids": [2]
}
```

  `reason` is required; `affected_member_ids` (cycle member ids, optional) highlights who needs a
  change, and must be in the submission (`affected_members_not_in_submission`). Every evaluation
  in the group reopens. Returns the group with `status: "returned"` and a new `version`.
- `POST admin/groups/{group}/approve`: `{"expected_version": 3}`. Returns the group with
  `status: "approved"`. Final results are written now and published at the Admin Final Review
  cutoff.

Both: stale `expected_version` → 409 with `base_version`/`current_version`; a group not
`pending_admin` → 422 `group_not_pending`; an Admin reviewing the group they manage → 422
`self_review_forbidden`.

After a return the manager edits (`PUT plans/{id}/evaluation`; values can be changed, not
cleared) and submits again; `latest_submission_no` increases.

### 9.9 Results

Final results contain the objectives, KPIs and targets, the component results, the overall % and
the rating. **Never** actuals, achievements, comments or evidence.

- `GET me/results?cycle=<id>` — Any. The user's own **published** results (Admins included).
- `GET results?cycle=<id>` — Any. Employee: own published results; Manager: published results of
  the people they managed at approval; Admin: everyone, including approved results not yet
  published (`published: false`).

```json
{
  "data": [
    {
      "id": 1,
      "cycle": { "id": 2, "name": { "...": "..." }, "performance_year": 2026, "status": "active" },
      "employee": { "id": 10, "code": "D0010", "name": "Yousef Demo" },
      "objectives": [
        { "text": "Deliver the yearly cost-saving programme", "category_name": { "...": "..." },
          "kpis": [ { "name": "Cost savings delivered", "measurement_type": "number_amount", "unit": "sar",
                      "direction": "higher", "target": "100000.0000", "weight_bp": 6000 } ] }
      ],
      "objectives_bp": 9200, "competency_bp": 9300, "overall_bp": 9220,
      "rating_level": 4, "rating_label": { "ar": "يفوق التوقعات", "en": "Exceeds Expectations" },
      "finalized_at": "2027-07-02T11:25:49+00:00",
      "published": true, "published_at": "2027-09-30T21:00:00+00:00"
    }
  ]
}
```

### 9.10 Sync runs and Admin grants

Employee data is synchronised from Jisr by a scheduled job on the server. The frontend only reads
the history.

- `GET admin/sync-runs` — A, paginated, newest first:

```json
{
  "data": [
    { "id": 1, "source": "seed", "status": "succeeded_with_issues",
      "started_at": "2026-11-22T11:25:33+00:00", "finished_at": "2026-11-22T11:25:33+00:00", "error": null,
      "stats": { "employees_created": 60, "employees_updated": 0, "managers_changed": 58, "...": 0 },
      "issue_counts": { "missing_email": 1 } }
  ]
}
```

- `GET admin/sync-runs/{run}/issues` — A, paginated, oldest first. Filters: `type`
  (`missing_email`, `manager_not_found`, `record_failed`, `job_title_without_template`,
  `manager_change_skipped`) and, for skipped manager moves, `reason` (`member_group_locked`,
  `no_new_manager`, `new_manager_inactive`, `target_group_locked`, `target_group_closed`).
- `POST admin/users/{user}/admin-grant` — A, 204. Gives the Admin role. `{user}` is a **user id**
  (`user.id` from login or `me`), not an employee id.
- `DELETE admin/users/{user}/admin-grant` — A, 204. Removing the last Admin is refused
  (`last_admin`).

---

## 10. Error rule codes

`details.rule` values of 422 `domain_rule_violated` (and the 409 duplicate), grouped by area.
Branch on these, never on `message`.

| Area | Rules |
|---|---|
| Policy | `weights_sum`, `first_threshold_zero`, `thresholds_increasing`, `bell_min_above_max`, `bell_min_sum`, `bell_max_sum` |
| Cycles | `cycle_not_draft`, `cycle_not_active`, `cycle_closed`, `deadline_in_past`, `deadline_outside_cycle`, `deadlines_out_of_order`, `performance_year_out_of_range`, `goal_setting_cutoff_passed`, `no_eligible_employees`, `no_policy_version`, `member_already_removed`, `stage_closed` |
| Plans | `plan_already_exists` (409), `invalid_transition`, `not_plan_author`, `content_locked`, `return_requires_comment`, `reopen_after_evaluation_started`, `no_objectives`, `objective_without_kpi`, `weights_sum`, `unit_not_allowed_for_type`, `category_inactive`, `plan_inactive`, `stage_closed` |
| Evaluation | `evaluation_not_open`, `evaluation_locked`, `evaluation_must_stay_complete`, `plan_not_evaluable`, `evidence_limit_reached` |
| Groups | `group_not_submittable` (with `blockers[]`), `group_locked` (removing a member whose group is submitted), `group_not_pending`, `affected_members_not_in_submission`, `self_review_forbidden` |
| Admins | `last_admin` |

`stage_closed` carries the stage and its cutoff in `details`, so you can say "the Goal Setting
deadline (15 Dec) has passed".

---

## 11. Email links and the HashRouter

The backend sends emails with links built from `FRONTEND_URL` plus a path such as
`/plans/12`. The frontend uses a **HashRouter**, so its routes live after `#`
(`https://pmp.example.com/#/plans/12`). Until this is settled, set `FRONTEND_URL` to end with
`/#` (for example `https://pmp.example.com/#`) so email links open the right screen. If the
frontend moves to a BrowserRouter, drop the `/#` and serve `index.html` for all routes.

---

## 12. UAT test clock

On UAT and local machines the server's notion of "now" can be moved forward, so you can test
deadlines without waiting months. It is a server command, not an API:

```bash
php artisan pmp:clock                       # show the current offset and the business time
php artisan pmp:clock --advance="10 days"   # move forward (any PHP relative time)
php artisan pmp:clock --reset               # back to the real time
```

Moving the clock also runs the deadline processor, so stage cutoffs take effect at once (missed
members are marked, results published). Every time the API returns (`cutoff_at`, `submitted_at`,
...) and every deadline check uses this clock, but your browser's clock doesn't move. So, on
UAT, **don't compare `cutoff_at` with the browser's `Date.now()`** to decide what is open.
Rely on `current_stage`, `allowed_actions`, `editable` and `can_submit` from the API; they are
always computed with the server clock.

---

## 13. Frontend checklist

- Send `Accept: application/json` and `Accept-Language` on every call; handle 401 globally by
  logging out.
- Parse every error as `{error: {code, message, fields?, details?}, request_id}`; map `fields` keys
  to form inputs by their dotted path.
- Keep the latest `version` from each write; on 409 keep the user's input and offer Reload.
- Show plan buttons from `allowed_actions`, evaluation editing from `editable`, group submit from
  `can_submit` and `blockers`.
- Treat bp as integers (÷100 to display), KPI numbers as decimal strings, plain dates as dates
  (no time-zone conversion).
- Handle both name shapes: `{ar, en}` objects and localised strings.
- Use ids carefully: employee id (scope, overrides, `manager_id`, member removal), cycle member id
  (create plan, group return, blockers), user id (admin grants), `plan_kpi_id` (evaluation and
  evidence), template `lineage_key` (template URLs).
- Upload evidence as multipart without setting `Content-Type`; download it as a blob with the
  Bearer header.
- Never show employees their own provisional evaluation; the API already returns 403, so don't
  link to it.
