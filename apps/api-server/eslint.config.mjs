import coreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import {
  typeSafetyRules,
  typeSafetyPendingWarn,
  responseValidationRules,
  responseValidationPendingWarn,
  usecaseCapabilityRules,
  usecaseCapabilityParameterExempt,
} from "../../eslint.rules.mjs";

const eslintConfig = [
  ...coreWebVitals,
  ...nextTypescript,
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
  responseValidationRules([
    "src/app/api/\\[\\[...route\\]\\]/**/{get,post}/index.ts",
  ]),
  // NOTE: 既存エンドポイントは未対応のため一旦 warn に留める。対応が完了したファイルからこの一覧を削る。
  responseValidationPendingWarn([
    "src/app/api/\\[\\[...route\\]\\]/link-types/get/index.ts",
    "src/app/api/\\[\\[...route\\]\\]/test/get/index.ts",
    "src/app/api/\\[\\[...route\\]\\]/users/me/post/index.ts",
    "src/app/api/\\[\\[...route\\]\\]/users/post/index.ts",
    "src/app/api/\\[\\[...route\\]\\]/users/me/get/index.ts",
    "src/app/api/\\[\\[...route\\]\\]/artists/\\[accountId\\]/get/index.ts",
    "src/app/api/\\[\\[...route\\]\\]/artists/get/index.ts",
    "src/app/api/\\[\\[...route\\]\\]/artists/me/post/index.ts",
    "src/app/api/\\[\\[...route\\]\\]/artists/me/profile/post/index.ts",
    "src/app/api/\\[\\[...route\\]\\]/artists/me/profile/get/index.ts",
    "src/app/api/\\[\\[...route\\]\\]/artists/me/profile/image/post/index.ts",
    "src/app/api/\\[\\[...route\\]\\]/artists/me/profile/publish/post/index.ts",
  ]),
  usecaseCapabilityRules(["src/usecases/**/*.ts"]),
  usecaseCapabilityParameterExempt([
    "src/usecases/authorization/**/*.ts",
    "src/usecases/capabilities/**/*.ts",
    "src/usecases/**/testDoubles/**/*.ts",
    "src/usecases/**/*.test.ts",
  ]),
];

export default eslintConfig;
