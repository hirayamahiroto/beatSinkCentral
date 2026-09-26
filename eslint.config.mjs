// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import coreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";
import {
  typeSafetyRules,
  typeSafetyPendingWarn,
  bffRouteStatusRules,
  hookTestRules,
  testDoubleRules,
} from "./eslint.rules.mjs";

const eslintConfig = [
  ...coreWebVitals,
  ...nextTypescript,
  prettier,
  {
    ignores: ["node_modules", ".next", "dist", "build", ".turbo"],
  },
  ...storybook.configs["flat/recommended"],
  {
    files: ["packages/ui/**/*.tsx"],
    rules: { "@next/next/no-img-element": "off" },
  },
  typeSafetyRules,
  typeSafetyPendingWarn([
    "apps/beatfolio/src/errorMap/index.ts",
    "apps/beatfolio/src/utils/client/errors/upstreamUnavailable/index.ts",
  ]),
  bffRouteStatusRules("apps/beatfolio"),
  hookTestRules(["apps/beatfolio/src/app/**/hooks/**/*.ts"]),
  testDoubleRules([
    "apps/beatfolio/src/**/*.{test.ts,test.tsx}",
    "apps/beatfolio/src/**/testDoubles/**/*.ts",
  ]),
];

export default eslintConfig;
