const TYPE_ASSERTION_MESSAGE =
  "`as` による型アサーションは使用しない。型ガード関数に切り出すか、正しく型付けされた契約から値を取得する。";

const TYPE_PREDICATE_MESSAGE =
  "`x is T` の型述語は使用しない。Result 型や明示的な分岐で絞り込む。";

const OPTIONAL_FALLBACK_MESSAGE =
  "optional な値を既定値で埋めない。欠落は throw / redirect で明示的に落とすか、正しく型付けされた契約から取得する。";

export const typeSafetySelectors = [
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

const RESPONSE_VALIDATION_MESSAGE =
  "c.json() に渡す値は返却直前に検証する。許可されるのは (1) schema.parse(value) の直書き、" +
  "(2) const result = schema.safeParse(value) の直後に if (!result.success) return ...; で早期リターンし " +
  "result.data を返す形、のいずれか。safeParse() の結果をガードなしで（.data 抜きで、または成功確認前に）渡さない。";

const RESPONSE_VALIDATION_SELECTOR =
  'ReturnStatement > CallExpression[callee.object.name="c"][callee.property.name="json"][arguments.length>0]';

const isMemberOf = (node, objectName, propertyName) =>
  node?.type === "MemberExpression" &&
  node.object?.type === "Identifier" &&
  node.object.name === objectName &&
  node.property?.type === "Identifier" &&
  node.property.name === propertyName;

const isCallToMethod = (node, methodName) =>
  node?.type === "CallExpression" &&
  node.callee?.type === "MemberExpression" &&
  node.callee.property?.type === "Identifier" &&
  node.callee.property.name === methodName;

const containsEarlyExit = (node) => {
  if (!node) return false;
  if (node.type === "ReturnStatement" || node.type === "ThrowStatement") {
    return true;
  }
  if (node.type === "BlockStatement") {
    return node.body.some(containsEarlyExit);
  }
  return false;
};

const isSuccessGuard = (statement, resultName) => {
  if (statement.type !== "IfStatement") return false;
  const { test } = statement;
  const isNegatedSuccess =
    test.type === "UnaryExpression" &&
    test.operator === "!" &&
    isMemberOf(test.argument, resultName, "success");
  const isFalseCompare =
    test.type === "BinaryExpression" &&
    (test.operator === "===" || test.operator === "==") &&
    isMemberOf(test.left, resultName, "success") &&
    test.right.type === "Literal" &&
    test.right.value === false;
  return (isNegatedSuccess || isFalseCompare) && containsEarlyExit(statement.consequent);
};

const isSafeParseDeclaration = (statement, resultName) =>
  statement.type === "VariableDeclaration" &&
  statement.declarations.some(
    (d) =>
      d.id.type === "Identifier" &&
      d.id.name === resultName &&
      isCallToMethod(d.init, "safeParse"),
  );

// safeParse() 経由で検証済みとみなすには、同じブロック内で
// 「宣言 → success ガード（早期リターン付き if）」の順で先行している必要がある。
// ブロックをまたぐ、あるいは順序が異なる場合はここでは追跡しない（値フロー解析はしない設計のため）。
const isGuardedSafeParseData = (blockBody, returnIndex, resultName) => {
  let declared = false;
  let guarded = false;
  for (let i = 0; i < returnIndex; i++) {
    const statement = blockBody[i];
    if (!declared && isSafeParseDeclaration(statement, resultName)) {
      declared = true;
      continue;
    }
    if (declared && !guarded && isSuccessGuard(statement, resultName)) {
      guarded = true;
    }
  }
  return declared && guarded;
};

const isValidatedResponseArg = (arg, returnStatement) => {
  if (isCallToMethod(arg, "parse")) return true;

  if (
    arg.type === "MemberExpression" &&
    arg.object.type === "Identifier" &&
    arg.property.type === "Identifier" &&
    arg.property.name === "data"
  ) {
    const block = returnStatement.parent;
    if (block?.type !== "BlockStatement") return false;
    const returnIndex = block.body.indexOf(returnStatement);
    return isGuardedSafeParseData(block.body, returnIndex, arg.object.name);
  }

  return false;
};

// no-restricted-syntax と同じ rule key を共有すると、後勝ちの flat config マージで
// typeSafetySelectors ごと severity が上書きされてしまう。severity を独立して
// 制御できるよう、専用の rule id を持つローカルプラグインとして定義する。
const responseValidationRule = {
  meta: {
    type: "problem",
    docs: { description: RESPONSE_VALIDATION_MESSAGE },
    schema: [],
  },
  create(context) {
    return {
      [RESPONSE_VALIDATION_SELECTOR](node) {
        const arg = node.arguments[0];
        if (isValidatedResponseArg(arg, node.parent)) return;
        context.report({ node, message: RESPONSE_VALIDATION_MESSAGE });
      },
    };
  },
};

const responseValidationPlugin = {
  rules: {
    "response-validation": responseValidationRule,
  },
};

export const responseValidationRules = (files) => ({
  files,
  plugins: { local: responseValidationPlugin },
  rules: {
    "local/response-validation": "error",
  },
});

export const responseValidationPendingWarn = (files) => ({
  files,
  plugins: { local: responseValidationPlugin },
  rules: {
    "local/response-validation": "warn",
  },
});
