import tseslint from "typescript-eslint";
import { typeSafetyRules } from "../../eslint.rules.mjs";

const eslintConfig = [
  {
    ignores: ["dist", ".next", ".turbo", "node_modules"],
  },
  ...tseslint.configs.recommended,
  typeSafetyRules,
];

export default eslintConfig;
