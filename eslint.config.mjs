import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{tsx,jsx}"],
    rules: {
      "no-restricted-syntax": ["error",
        { selector: "JSXOpeningElement[name.name='input']", message: "Use Ant Design Input or Checkbox through the shared UI primitives." },
        { selector: "JSXOpeningElement[name.name='textarea']", message: "Use Ant Design Input.TextArea through the shared UI primitives." },
        { selector: "JSXOpeningElement[name.name='select']", message: "Use Ant Design Select through the shared UI primitives." },
        { selector: "JSXOpeningElement[name.name='button']", message: "Use Ant Design Button through the shared UI primitives." },
        { selector: "JSXOpeningElement[name.name='table']", message: "Use Ant Design Table through the shared UI primitives." },
        { selector: "JSXOpeningElement[name.name='details']", message: "Use Ant Design Collapse through the shared UI primitives." }
      ]
    }
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"])
]);