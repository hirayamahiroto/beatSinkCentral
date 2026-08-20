// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import coreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";
import { typeSafetyRules, typeSafetyPendingWarn } from "./eslint.rules.mjs";

const eslintConfig = [
  ...coreWebVitals,
  ...nextTypescript,
  prettier,
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
