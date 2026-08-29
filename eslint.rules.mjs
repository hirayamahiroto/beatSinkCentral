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

// なぜ safeParse を主形として認めるか: schema.parse() は失敗時に ZodError を
// 投げるだけで、errorMap の AppError 型（type フィールドによる errorType 分類）
// を持たない。そのため parse() の例外は常に UnhandledError という未分類バケツに
// 落ち、他の予期しない 500 と見分けがつかない。safeParse() で明示的に分岐すれば、
// 失敗時に issuePaths 等を積んだ型付きエラー（例: ResponseContractViolationError）
// を組み立ててから throw できるため、内部ログを errorType で分離して追跡できる
// （docs/architecture/server/error-handling/operations.md の errorType 次元化）。
// schema.parse() の直書きも許可しているのは、型付きエラーへの変換が不要な
// 単純なケース向けの最小構成として残している。
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

// なぜ型ではなく lint か: 「usecase の第1引数は権能である」を型で強制するには
// defineUsecase / Exact のようなラッパを全 usecase に被せる必要があるが、
// docs/architecture/server/architecture.md「認可と権能（capabilities）」は
// そのコストに見合わないとして採用しないと決めている。よって規範（advisory）に
// 留まっていた2点 —— (1) usecase が権能を経由せず DB へ到達しない、
// (2) 第1引数が権能型である —— を AST 上の形として検出する。
const USECASE_CAPABILITY_BOUNDARY_MESSAGE =
  "usecases/ から infrastructure 層・DB / ストレージクライアントを直接 import しない。" +
  "DB への到達手段は第1引数で受け取る権能（capabilities）だけに限る。";

const USECASE_CAPABILITY_PARAMETER_MESSAGE =
  "usecase のエクスポート関数は第1引数で権能（capabilities）を受け取る。" +
  "`caps: XxxCapabilities` もしくは `Pick<XxxCapabilities, ...>` を型注釈に持つ形にする。";

// usecases/ から見て「権能を迂回して DB へ到達しうる」入口。
// infrastructure/ は権能の組み立て側（Composition Root）で、リポジトリ実装と db を握る。
const RESTRICTED_USECASE_SOURCES = [
  /(^|\/)infrastructure(\/|$)/,
  /^database(\/|$)/,
  /^drizzle-orm(\/|$)/,
  /^@supabase\//,
];

const isRestrictedUsecaseSource = (source) =>
  typeof source === "string" &&
  RESTRICTED_USECASE_SOURCES.some((pattern) => pattern.test(source));

const usecaseCapabilityBoundaryRule = {
  meta: {
    type: "problem",
    docs: { description: USECASE_CAPABILITY_BOUNDARY_MESSAGE },
    schema: [],
  },
  create(context) {
    const reportIfRestricted = (node, sourceNode) => {
      if (sourceNode?.type !== "Literal") return;
      if (!isRestrictedUsecaseSource(sourceNode.value)) return;
      context.report({ node, message: USECASE_CAPABILITY_BOUNDARY_MESSAGE });
    };

    return {
      ImportDeclaration(node) {
        reportIfRestricted(node, node.source);
      },
      ExportNamedDeclaration(node) {
        reportIfRestricted(node, node.source);
      },
      ExportAllDeclaration(node) {
        reportIfRestricted(node, node.source);
      },
      ImportExpression(node) {
        reportIfRestricted(node, node.source);
      },
    };
  },
};

// Pick<Caps, ...> のように権能型を包むユーティリティ型は展開して中身で判定する。
const CAPABILITY_WRAPPER_TYPES = new Set([
  "Pick",
  "Omit",
  "Readonly",
  "Partial",
]);

const CAPABILITY_TYPE_NAME = /(Caps|Capabilities)$/;

// typescript-eslint は v8 で TSTypeReference の型引数を typeArguments に移した。
// 旧フィールド名でも動くよう両方を見る。
const typeArgumentsOf = (typeNode) =>
  typeNode.typeArguments ? typeNode.typeArguments : typeNode.typeParameters;

const isCapabilityType = (typeNode) => {
  if (!typeNode || typeNode.type !== "TSTypeReference") return false;
  if (typeNode.typeName.type !== "Identifier") return false;

  const typeName = typeNode.typeName.name;
  if (CAPABILITY_TYPE_NAME.test(typeName)) return true;
  if (!CAPABILITY_WRAPPER_TYPES.has(typeName)) return false;

  const typeArguments = typeArgumentsOf(typeNode);
  if (!typeArguments) return false;
  return isCapabilityType(typeArguments.params[0]);
};

const receivesCapabilities = (fn) => {
  const [firstParameter] = fn.params;
  if (!firstParameter) return false;
  return isCapabilityType(firstParameter.typeAnnotation?.typeAnnotation);
};

const FUNCTION_TYPES = new Set([
  "ArrowFunctionExpression",
  "FunctionExpression",
  "FunctionDeclaration",
]);

const exportedFunctionsOf = (declaration) => {
  if (!declaration) return [];
  if (FUNCTION_TYPES.has(declaration.type)) return [declaration];
  if (declaration.type !== "VariableDeclaration") return [];
  return declaration.declarations
    .map((declarator) => declarator.init)
    .filter((init) => init && FUNCTION_TYPES.has(init.type));
};

const usecaseCapabilityParameterRule = {
  meta: {
    type: "problem",
    docs: { description: USECASE_CAPABILITY_PARAMETER_MESSAGE },
    schema: [],
  },
  create(context) {
    const checkExport = (node) => {
      for (const fn of exportedFunctionsOf(node.declaration)) {
        if (receivesCapabilities(fn)) continue;
        context.report({
          node: fn,
          message: USECASE_CAPABILITY_PARAMETER_MESSAGE,
        });
      }
    };

    return {
      ExportNamedDeclaration: checkExport,
      ExportDefaultDeclaration: checkExport,
    };
  },
};

const usecaseCapabilityPlugin = {
  rules: {
    "usecase-capability-boundary": usecaseCapabilityBoundaryRule,
    "usecase-capability-parameter": usecaseCapabilityParameterRule,
  },
};

export const usecaseCapabilityRules = (files) => ({
  files,
  plugins: { local: usecaseCapabilityPlugin },
  rules: {
    "local/usecase-capability-boundary": "error",
    "local/usecase-capability-parameter": "error",
  },
});

// 権能を「組み立てる／定義する」側（経路モジュールは CapabilityDeps を受け、
// resolution / conflict は純粋関数）と、テスト・テストダブルは、第1引数で権能を
// 受け取る形にはならない。DB への直接到達の禁止（boundary）は外さない。
export const usecaseCapabilityParameterExempt = (files) => ({
  files,
  plugins: { local: usecaseCapabilityPlugin },
  rules: {
    "local/usecase-capability-parameter": "off",
  },
});
