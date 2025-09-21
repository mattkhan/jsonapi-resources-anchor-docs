import path from "node:path";
import mattConfig from "@matt/eslint-config-me";
import nextPlugin from "@next/eslint-plugin-next";

import { FlatCompat } from "@eslint/eslintrc";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const config = [
  ...mattConfig,
  ...compat.config({ extends: ["next/core-web-vitals", "next/typescript"] }),
  {
    linterOptions: {
      reportUnusedDisableDirectives: "error",
    },
    plugins: { next: nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
    },
  },
];

export default config;
