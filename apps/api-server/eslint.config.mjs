import coreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import {
  typeSafetyRules,
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
