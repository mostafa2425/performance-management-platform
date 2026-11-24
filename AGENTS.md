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
