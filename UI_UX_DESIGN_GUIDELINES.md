# UI/UX Design Guidelines

**Status:** Project-wide visual reference  
**Reference implementation:** Manager Dashboard (Team Overview)  
**Reference commit:** `a817ab56e4f4de386e5d4ebfc0d739e0254024cc`  
**Scope:** Admin, Manager, Employee, and shared application experiences

This document defines the visual language and interaction patterns to reuse across the Performance Management Platform. The Manager Dashboard is the reference for visual consistency, not a template that every page must copy literally.

## 1. Design principles

- **Clear hierarchy:** page title and purpose first, primary content second, supporting metadata last.
- **Compact, not cramped:** reduce unnecessary vertical whitespace while keeping readable line-height and comfortable hit targets.
- **Data-first:** tables and operational data should be scannable before decorative elements.
- **Consistent actions:** primary, secondary, destructive, and text actions must look and behave consistently.
- **Responsive by default:** layouts wrap naturally; avoid fixed-width assumptions and horizontal overflow except inside intentionally scrollable data tables.
- **Accessible:** visible focus, sufficient contrast, semantic controls, keyboard support, and status labels that do not rely on color alone.
- **Preserve product behavior:** visual refactors must not change API contracts, permissions, validation, workflow transitions, or business logic.
- **Bilingual and RTL-safe:** use logical CSS properties and verify Arabic and English layouts independently.

## 2. Visual tokens

Use these as the baseline. Prefer shared CSS variables or Ant Design theme tokens over repeating literal values.

| Token | Value | Usage |
|---|---|---|
| App background | `#f8fafc` / `#f5f7fb` | Main canvas, use existing shell background where already established |
| Surface | `#ffffff` | Cards, tables, menus |
| Primary text | `#0f172a` | Headings and important values |
| Secondary text | `#475569` | Body metadata |
| Muted text | `#64748b` | Labels and supporting copy |
| Subtle text | `#94a3b8` | IDs, quiet metadata |
| Border | `#e2e8f0` | Card and table borders |
| Subtle border | `#f1f5f9` | Table row separators |
| Primary teal | `#0d9488` | Primary actions, active accents |
| Teal dark | `#0f766e` | Text on pale teal surfaces |
| Teal tint | `#f0fdfa` | Soft active backgrounds |
| Amber | `#d97706` | Draft / attention state |
| Amber tint | `#fffbeb` | Draft row and status backgrounds |
| Navy sidebar | Existing shell navy | Keep current application navigation identity |

### Shape and elevation

- Standard card radius: **10–12px**.
- Control and button radius: **7–8px**.
- Status pill radius: **999px**.
- Borders: 1px solid neutral border.
- Prefer no shadow or a very subtle shadow; avoid heavy elevation.
- Use a 2–3px top accent on KPI cards only when it conveys a category/state.

## 3. Spacing and sizing

Use a consistent 4px-based rhythm.

| Element | Guideline |
|---|---|
| Page section gap | 16–20px |
| Card padding | 14–18px |
| Table cell horizontal padding | 14–18px |
| Table cell vertical padding | 9–12px |
| Filter row gap | 8–12px |
| Standard input/select/button height | 36–42px; align controls within a screen |
| Compact table action height | 30–34px |
| Avatar in employee cell | 32–36px |
| KPI card gap | 8–12px |

Do not add margins to adjacent components when the parent layout already provides a gap. Avoid large empty vertical areas between a page header, summary cards, and primary data.

## 4. Page header

- Put the page title and a concise description together on the leading side.
- Put page-level actions and current context (such as active cycle) together on the trailing side.
- Keep refresh and other secondary actions visually quiet.
- On narrow screens, allow the header to wrap without overlapping or shrinking controls below usable sizes.
- Do not repeat the same page title in a second section heading unless it provides meaningful context.

## 5. KPI and summary cards

- Use CSS Grid with responsive wrapping, never force all metrics into one row.
- Use a sensible minimum card width (typically 140–160px) and let the number of columns adapt to available space.
- Desktop: usually 4–6 cards per row depending on available content width.
- Tablet: 2–3 cards per row.
- Mobile: 2 cards per row where labels remain readable; fall back to one when necessary.
- Keep label, value, and optional percentage aligned consistently.
- Use a neutral default state. Reserve teal for key totals/positive progress and amber for drafts/attention.
- Avoid hard-coded metric values or dashboard-specific assumptions in shared components.

## 6. Tables — project-wide standard

All data tables should converge on the following visual treatment while retaining each page's columns and domain-specific behavior.

### Table container and header

- Place the table in a white surface with a subtle border and 10–12px radius when the surrounding layout calls for a contained table.
- Use a light neutral header background (`#f8fafc`).
- Header text: muted slate, 10–11px, semibold/bold, optional uppercase tracking for dense enterprise tables.
- Use a thin bottom border; remove decorative vertical dividers unless they clarify a complex matrix.
- Keep header labels concise and aligned consistently with their cells.

### Rows and cells

- Use white rows with subtle horizontal separators (`#f1f5f9`).
- Typical cell padding: 9–12px vertical and 14–18px horizontal.
- Add a restrained hover background (`#f8fafc`).
- Use compact but readable body text, generally 12–13px for dense tables.
- Avoid excessive row height, but allow rows to grow for wrapped content.
- Do not truncate essential names, identifiers, dates, or statuses without an accessible way to inspect the full value.

### Employee / person cells

Where a row represents a person, use a consistent identity cell:
- 32–36px circular avatar or initials fallback.
- Person's name as the primary bold line.
- Employee ID/code as a secondary muted line beneath the name.
- A small, consistent gap between avatar and text.
- Keep name and ID on separate lines; never concatenate them visually.

### Status cells

- Use compact rounded pills with a small dot and readable text.
- Suggested semantic palette: neutral slate for not started/default, amber for draft/attention, blue for pending/review, red for returned/blocked, green for approved/completed.
- Always show the status text; color is supplementary.
- Reuse the same status mapping across dashboards, lists, and detail tables.

### Row actions

- Primary action: solid teal background with white text.
- Secondary action: white background, subtle teal border, teal text.
- Destructive actions: semantic red and explicit confirmation when required by existing behavior.
- Keep action labels verb-based and concise.
- Align action cells consistently (right in LTR, left in RTL).
- Preserve existing links, permissions, disabled states, and workflow rules.

### Filters and pagination

- Keep filters directly above the table and visually grouped.
- Align input/select heights (default target 36–40px; use the existing 42px project control standard where the shared form system requires it).
- Search should take the remaining available width.
- Clear/reset filters should be a quiet text action near the filter heading.
- Pagination should be compact and remain usable on mobile; total-count text may wrap onto its own line.

### Responsive tables

- Prefer responsive column priorities and wrapping for non-critical content.
- Use horizontal scrolling only when the table genuinely requires it; keep the employee/name and action context discoverable.
- Do not hide critical workflow status or the only available action on mobile.
- Consider a stacked/card row presentation only where it materially improves mobile usability and can preserve all actions.

## 7. Buttons and controls

- Use Ant Design components and shared classes/tokens rather than one-off inline styles.
- Keep buttons in the same visual family across pages: solid teal primary, outlined neutral/teal secondary, quiet text tertiary, semantic destructive.
- Inputs, Selects, DatePickers, and other controls in the same form row must share a consistent height, border, radius, font size, and focus treatment.
- Provide clear disabled/loading states.
- Avoid emoji as functional icons; use the project's icon library consistently.
- Do not override Ant Design styles globally in ways that break modal, compact, inline, or special-purpose controls. Scope styles to reusable variants or semantic wrappers.

## 8. Cards, sections, and forms

- White cards with subtle borders and consistent radius are the default surface.
- Section headings should be compact and aligned; use clear labels rather than oversized headings.
- Group related fields and actions; avoid excess card nesting.
- Form labels, helper text, validation errors, and required markers must remain readable in both locales.
- Maintain the established project-wide control height standard when touching shared forms.

## 9. Arabic, RTL, and localization

- Use CSS logical properties: `margin-inline`, `padding-inline`, `inset-inline`, `border-inline`, and logical text alignment where appropriate.
- Avoid hard-coded left/right spacing and directional arrows that do not mirror.
- Verify avatar/name order, action alignment, pagination, table overflow, filter order, and icons in Arabic.
- All user-facing text must use the project's localization system; do not hard-code English labels in shared UI.
- Preserve locale-aware number/date formatting already used by the feature.

## 10. Accessibility and interaction

- Keep focus indicators visible.
- Ensure clickable rows/cards do not swallow nested links or buttons.
- Use semantic table headers and accessible labels for icon-only controls.
- Status must be conveyed by text as well as color.
- Respect reduced motion; keep hover transitions subtle.
- Do not reduce touch targets below practical mobile sizes.

## 11. Implementation and migration rules

1. Inventory every table, data grid, list, dashboard, and shared table wrapper before broad changes.
2. Identify shared components first; prefer improving a shared primitive over duplicating page-specific CSS.
3. Migrate in role-based batches: shared shell/components, Admin, Manager, Employee, then remaining specialized screens.
4. Preserve each table's columns, sorting, filtering, pagination, row keys, empty/loading/error states, permissions, and actions.
5. Do not change API requests, payloads, backend response assumptions, or workflow state transitions as part of a visual-only migration.
6. Keep page-specific exceptions explicit and documented; do not force matrix/schedule/configuration tables into the employee-list pattern.
7. After each batch, run lint, typecheck, tests, and production build where available; inspect English and Arabic at desktop and mobile widths.
8. Search for Ant Design deprecations and verify browser console warnings are resolved rather than suppressed.
9. Review actual screenshots at representative breakpoints before declaring a batch complete.
10. Update this guide when a deliberate design-system decision changes.

## 12. Definition of done

A migrated screen is complete only when:
- It follows the shared typography, color, spacing, card, control, table, and button patterns.
- It remains responsive and works in both English LTR and Arabic RTL.
- It preserves all existing data, permissions, actions, validation, and workflows.
- Loading, empty, error, and disabled states remain visually coherent.
- No new TypeScript, lint, build, or browser-console errors are introduced.
- The screen has been visually checked at desktop and mobile widths.

## 13. BRD alignment and role-specific presentation guardrails

The visual system must support the workflows defined in `Performance_managment_platform_V1.2.pdf`. Visual consistency must never weaken role permissions or reveal information earlier than the BRD allows.

### Admin experiences

- Admin dashboard summaries should make Employee Status Summary, Active Performance Cycles, and Manager Progress easy to scan.
- Manager Progress and employee lists should support the BRD-defined search/filter dimensions where the underlying feature provides them (for example name, Employee ID, email, cycle, business unit, department, job title, and status).
- Cycle lists and cycle details should clearly distinguish Draft, Active, and Closed, and present performance year, scope, dates, and current stage where applicable.
- Admin employee details are read-only for employee/organizational information and plan content unless a specific Admin business action is available.
- Authorized Admin details may include KPI Actual, Achievement %, Weighted KPI Result, Manager Comments, and Evidence; use clear grouping and dense but readable detail layouts.
- Bell Curve and final review screens are operational review tools. Preserve group context, configured limits, validation failures, allowed actions, and audit history; do not style provisional values as finalized results.

### Manager experiences

- Manager Dashboard is the primary visual reference. It should prioritize direct-report totals, status distribution, active cycle context, team progress, and the direct-report table.
- Manager data must remain scoped to authorized Direct Reports and the applicable performance cycle.
- Employee/person rows should show identity clearly (name and Employee ID separately), applicable cycle, current performance status, and only the action allowed by the current workflow state.
- Manager employee details may show authorized workflow history and evaluation details. Preserve the distinction between editable fields, read-only fields, provisional scores, and finalized results.
- Manager–Year Group and Bell Curve views must retain group-level context and validation visibility; do not force these specialized tables into a simple employee-list layout.

### Employee experiences

- Employee views should emphasize their own assigned objectives, KPIs, targets, weights, competencies, current status, and next available action, subject to the applicable workflow stage.
- Approved objectives/KPI targets and published results are read-only where required by the BRD.
- Employee Performance Results must be visible only after finalization and publication.
- Employee-facing published results may show Annual Objectives Result, Annual Competency Result, Overall Annual Performance %, and Final Annual Rating.
- Never expose individual KPI Actuals, Achievement %, Weighted KPI Results, Manager Comments, or supporting Evidence in Employee Results.
- Do not expose internal Manager/Admin workflow or audit discussions to Employees when the BRD restricts that history.

### Cross-role business constraints to preserve during UI work

- Employee inclusion/exclusion, active-cycle uniqueness, manager reassignment, and historical manager records must remain governed by the BRD and backend rules.
- A visual status badge must reflect the actual workflow status; do not invent a new status or infer permissions from colors.
- Workflow actions must be driven by the backend's allowed actions/permissions and existing feature logic.
- Provisional and draft annual results must never be visually presented as published/final results.
- Notifications, templates, recipients, and triggers remain controlled by existing business rules; UI consistency does not authorize changing them.

