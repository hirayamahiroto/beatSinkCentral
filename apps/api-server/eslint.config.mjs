import coreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import {
  typeSafetyRules,
  typeSafetyPendingWarn,
  responseValidationRules,
  usecaseCapabilityRules,
  usecaseCapabilityParameterExempt,
  usecaseSubjectNotFoundExempt,
  entityBehaviorRules,
  testDoubleRules,
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
    "src/errorMap/createAppErrorHandler/index.ts",
    "src/infrastructure/capabilities/builders/index.test.ts",
    "src/infrastructure/repositories/*/index.test.ts",
    "src/infrastructure/transaction/index.test.ts",
    "src/middlewares/auth0/errors/unauthorized/index.ts",
    "src/authorization/conflict/index.ts",
    "src/utils/result/index.ts",
  ]),
  responseValidationRules([
    "src/app/api/\\[\\[...route\\]\\]/**/{get,post}/index.ts",
  ]),
  usecaseCapabilityRules([
    "src/usecases/**/*.ts",
    "src/authorization/**/*.ts",
    "src/capabilities/**/*.ts",
  ]),
  usecaseCapabilityParameterExempt([
    "src/authorization/**/*.ts",
    "src/capabilities/**/*.ts",
    "src/usecases/**/*.test.ts",
  ]),
  usecaseSubjectNotFoundExempt(["src/authorization/resolution/**/*.ts"]),
  entityBehaviorRules(["src/domain/*/entities/index.ts"]),
  testDoubleRules(["src/**/*.test.ts", "src/**/testDoubles/**/*.ts"]),
];

export default eslintConfig;
