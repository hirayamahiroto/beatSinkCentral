// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import { typeSafetyRules, typeSafetyPendingWarn } from "./eslint.rules.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  ...compat.extends("prettier"),
  {
    ignores: ["node_modules", ".next", "dist", "build", ".turbo"],
  },
  ...storybook.configs["flat/recommended"],
  typeSafetyRules,
  typeSafetyPendingWarn([
    "apps/beatfolio/src/app/api/**/index.test.ts",
    "apps/beatfolio/src/errorMap/index.ts",
    "apps/beatfolio/src/utils/client/errors/upstreamUnavailable/index.ts",
  ]),
];

export default eslintConfig;
