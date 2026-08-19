const TYPE_ASSERTION_MESSAGE =
  "`as` による型アサーションは使用しない。型ガード関数に切り出すか、正しく型付けされた契約から値を取得する。";

const TYPE_PREDICATE_MESSAGE =
  "`x is T` の型述語は使用しない。Result 型や明示的な分岐で絞り込む。";

const OPTIONAL_FALLBACK_MESSAGE =
  "optional な値を既定値で埋めない。欠落は throw / redirect で明示的に落とすか、正しく型付けされた契約から取得する。";

const typeSafetySelectors = [
  {
    selector: 'TSAsExpression:not([typeAnnotation.typeName.name="const"])',
    message: TYPE_ASSERTION_MESSAGE,
  },
  {
    selector: "TSTypeAssertion",
    message: TYPE_ASSERTION_MESSAGE,
  },
  {
    selector: "TSTypePredicate",
    message: TYPE_PREDICATE_MESSAGE,
  },
  {
    selector:
      'LogicalExpression[operator="??"][left.type="ChainExpression"]:not([right.name="undefined"])',
    message: OPTIONAL_FALLBACK_MESSAGE,
  },
  {
    selector: 'LogicalExpression[operator="??"][right.value=""]',
    message: OPTIONAL_FALLBACK_MESSAGE,
  },
  {
    selector: 'LogicalExpression[operator="??"][right.value=0]',
    message: OPTIONAL_FALLBACK_MESSAGE,
  },
  {
    selector:
      'LogicalExpression[operator="??"][right.type="Literal"][right.raw="false"]',
    message: OPTIONAL_FALLBACK_MESSAGE,
  },
  {
    selector:
      'LogicalExpression[operator="??"][right.type="ArrayExpression"][right.elements.length=0]',
    message: OPTIONAL_FALLBACK_MESSAGE,
  },
];

export const typeSafetyRules = {
  files: ["**/*.ts", "**/*.tsx"],
  rules: {
    "no-restricted-syntax": ["error", ...typeSafetySelectors],
    "@typescript-eslint/no-unused-vars": "error",
  },
};

export const typeSafetyPendingWarn = (files) => ({
  files,
  rules: {
    "no-restricted-syntax": ["warn", ...typeSafetySelectors],
  },
});
