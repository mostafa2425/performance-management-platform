<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Ant Design deprecation prevention

- For Ant Design `Space`, always use `orientation="vertical"` or `orientation="horizontal"`. Never use the deprecated `direction` prop.
- Before finishing any UI change, search the entire `src` tree for deprecated Space usage, including multiline JSX:
  `rg -n -U '<Space\\b[^>]*\\bdirection\\s*=' src`
- The search must return no matches. Do not blindly rename `direction` on other components; this rule applies specifically to Ant Design `Space`.
- Check the browser console after UI changes for Ant Design deprecation warnings. Fix the source component rather than suppressing the warning.

## Ant Design Form instance lifecycle

- Every `Form.useForm()` instance must be connected to a mounted `<Form form={form}>` during the component render lifecycle.
- Do not create a form instance in a component while rendering its `<Form>` only conditionally (for example, only after an API query resolves, only in edit mode, or only when a modal opens). Keep the owning `<Form>` mounted with conditional fields/content, or move `Form.useForm()` into the child component that is mounted together with that `<Form>`.
- When a form is used inside a modal, ensure the modal/form mounting strategy keeps the instance connected before calling `submit`, `validateFields`, `setFieldsValue`, or `resetFields`.
- Before finishing form changes, inspect every `Form.useForm()` and confirm its matching `<Form form={form}>` is mounted on every render path where the instance exists. Check the browser console for the unconnected-instance warning; do not suppress it.

## Ant Design Form initial value ownership

- Do not set `Form.Item initialValue` for a field path that is already provided by the owning `<Form initialValues>`; this causes the warning that the field cannot overwrite the form-level value.
- For nested/repeated fields, initialize the complete array/object shape in `Form initialValues` (or update it with `form.setFieldsValue`) and keep each `Form.Item` responsible only for binding/validation. Use `Form.Item initialValue` only when the same path is not initialized at the Form level and the installed Ant Design API supports that pattern.
- When changing form initialization, preserve hidden identifiers and verify the submitted payload still includes them.

## Ant Design Card deprecation prevention

- For Ant Design `Card`, never use the deprecated `bodyStyle` prop. Use `styles={{ body: { ... } }}` for body styling.
- Before finishing UI changes, search the entire `src` tree for deprecated Card props:
  `rg -n -U '<Card\\b[^>]*\\bbodyStyle\\s*=|bodyStyle\\s*=' src`
- Replace every deprecated `bodyStyle` usage with the appropriate semantic `styles` slot. Do not move body styles to the outer Card `style` prop, because that changes the element being styled.

## Runtime warning and SVG error handling

- Treat browser-console warnings as actionable defects. Check the complete warning/error text and stack trace, identify the source component, and fix the source rather than suppressing the warning or hiding console output.
- For Ant Design deprecations, use the replacement API documented by the installed Ant Design version. Do not assume a prop replacement is valid on unrelated components.
- If the console or user report contains only a fragment such as `svg`, do not guess at the cause. Request or inspect the complete error message and stack trace, then trace it to the exact component or asset before changing code.
- Validate SVG usage in JSX and assets only when the full error points to SVG rendering or loading; do not make speculative global SVG changes.
- Before completing a UI fix, run the relevant repository-wide searches above and inspect the browser console on the affected screen(s). Record any remaining unverified runtime behavior clearly.

## Project-wide UI/UX design reference

- Before implementing or changing UI in any role or feature, read `UI_UX_DESIGN_GUIDELINES.md` at the repository root.
- Treat the Manager Dashboard Team Overview as the visual reference for shared design language: compact spacing, white bordered surfaces, slate typography, teal primary actions, restrained amber draft states, responsive KPI wrapping, employee identity cells, status pills, and clean table headers/rows.
- Apply the guidelines to Admin, Manager, Employee, and shared experiences. Reuse shared components/tokens where practical; do not copy the manager dashboard layout into unrelated pages.
- All project tables should converge on the documented table treatment, while preserving domain-specific columns, matrix layouts, data behavior, permissions, sorting, filtering, pagination, and actions.
- Keep UI-only work separate from API contracts and business workflows. Never alter endpoint calls, payloads, role checks, allowed actions, or workflow transitions merely to achieve visual consistency.
- Preserve bilingual English/Arabic support and verify RTL using CSS logical properties. Every new user-facing string must use the existing localization system.
- For broad UI migrations, inventory the target screens first and migrate in small role-based batches. Run lint, typecheck, tests, and build where available; inspect console warnings and verify desktop/mobile plus LTR/RTL before declaring completion.
- Do not apply global Ant Design overrides that unintentionally change modal, compact, inline, or specialized controls. Prefer scoped reusable variants and semantic wrappers.

- When UI work affects performance dashboards, employee details, evaluation, Bell Curve, final review, or published results, verify role visibility and workflow requirements against `Performance_managment_platform_V1.2.pdf` (BRD) and the relevant API guide. Do not expose Employee-hidden KPI Actuals, Achievement %, Weighted KPI Results, Manager Comments, Evidence, or restricted internal workflow history in Employee-facing screens.
- Keep provisional/draft results visually distinct from finalized and published results. Use existing backend status and allowed-action data; never infer permissions from a visual status.

- All application data tables must use `@/components/ui/data-table` (`DataTable`). Do not import Ant Design `Table` directly into feature/page components. Preserve existing Table props and business behavior. Legacy `AppTable` must delegate to `DataTable`; specialized layouts may use scoped classes but must retain shared visual tokens.

## Ant Design API compatibility and deprecation gate

This section is mandatory for every new UI implementation, refactor, bug fix, and code review in this repository.

### Before writing or editing Ant Design code
1. Read this `AGENTS.md` file and `UI_UX_DESIGN_GUIDELINES.md` first.
2. Identify the installed Ant Design version from `package.json` / lockfile. This project uses Ant Design v6; do not copy examples written for older major versions without checking compatibility.
3. Consult the documentation and TypeScript definitions shipped with the installed Ant Design package in `node_modules/antd` for the exact component and prop being changed. Prefer the installed package's API over memory, old snippets, blog posts, or examples from a different version.
4. Search existing usage of the component before adding a new pattern. Reuse the current supported API.
5. Never silence, filter, or suppress an Ant Design warning. Replace the deprecated API at its source.

### Known deprecated APIs and supported replacements

| Component / API | Do not use | Use instead |
|---|---|---|
| `Space` | `direction` | `orientation="vertical"` or `orientation="horizontal"` |
| `Card` | `bodyStyle`, `headStyle` | Semantic `styles={{ body: ... }}` / `styles={{ header: ... }}` |
| `Drawer` | `width`, `height` | `size` (use a supported preset or numeric size; use semantic styles for responsive constraints) |
| `Timeline` items | `dot` | `icon` |
| `Progress` | `trailColor` | `railColor` |
| `Statistic` | `valueStyle`, `titleStyle` | Semantic `styles` slots, e.g. `styles={{ content: ... }}` and the documented title slot |
| `Alert` | `message` | `title` for the alert heading; put supporting content in `description` |
| `Timeline` items | legacy item `children` content shape | Use the current documented item content field (`content`) |
| `Descriptions` | legacy item `label` / `children` patterns where flagged by installed typings | Use the current documented item shape and slots |
| `Tabs` | deprecated legacy tab children | Use the `items` API |
| `Dropdown` | deprecated legacy overlay API | Use `menu` |
| `Menu` | deprecated legacy item children where flagged | Use the documented `items` data API |

This table is a quick warning-prevention checklist, not a substitute for checking the installed version. If a deprecation warning names another component or prop, inspect that component's installed documentation/types and add the confirmed replacement to this table.

### Required repository-wide checks before finishing UI work

Run these searches (including multiline JSX) and resolve every deprecated usage in the changed scope. For a broad cleanup, resolve all matches across `src`.

```bash
# Space
rg -n -U '<Space\\b[^>]*\\bdirection\\s*=' src

# Card
rg -n -U '<Card\\b[^>]*\\b(bodyStyle|headStyle)\\s*=' src
rg -n '\\b(bodyStyle|headStyle)\\s*=' src

# Drawer deprecated sizing
rg -n -U '<Drawer\\b[^>]*\\b(width|height)\\s*=' src

# Timeline deprecated dot
rg -n -U '\\bdot\\s*:' src

# Progress deprecated rail color
rg -n -U '\\btrailColor\\s*=' src

# Statistic deprecated styling
rg -n -U '\\b(valueStyle|titleStyle)\\s*=' src

# Alert deprecated heading prop
rg -n -U '<Alert\\b[^>]*\\bmessage\\s*=' src
```

Also run lint and typecheck, then run the app and inspect the browser console on every affected screen. Fix warnings at their source. Do not report a search as clean unless it was actually run; document any remaining match and why it is a valid exception.
