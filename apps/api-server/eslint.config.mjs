import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import { typeSafetyRules, typeSafetyPendingWarn } from "../../eslint.rules.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  typeSafetyRules,
  typeSafetyPendingWarn([
    "src/domain/artistProfiles/policies/publishability/index.ts",
    "src/domain/artists/errors/*/index.ts",
    "src/domain/users/errors/*/index.ts",
    "src/domain/users/valueObjects/sub/index.test.ts",
    "src/errorMap/index.ts",
    "src/infrastructure/capabilities/builders/index.test.ts",
    "src/infrastructure/repositories/*/index.test.ts",
    "src/infrastructure/transaction/index.test.ts",
    "src/middlewares/auth0/errors/unauthorized/index.ts",
    "src/usecases/authorization/conflict/index.ts",
    "src/utils/result/index.ts",
  ]),
];

export default eslintConfig;
