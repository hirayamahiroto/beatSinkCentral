import { readdirSync, readFileSync } from "node:fs";
import { join, sep } from "node:path";

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
  return (
    (isNegatedSuccess || isFalseCompare) &&
    containsEarlyExit(statement.consequent)
  );
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

// 変数・テンプレートリテラルで組み立てた import 先は静的に確認できず、
// boundary の検査をすり抜ける。usecases/ に動的な依存解決を持ち込む理由が無いため、
// 解決先を確認できない dynamic import そのものを禁止して穴を残さない。
const USECASE_UNRESOLVABLE_IMPORT_MESSAGE =
  "usecases/ では import 先を静的に確認できない dynamic import（変数・式で組み立てたパス）を使わない。" +
  "権能を迂回した DB への到達を検出できなくなる。";

const USECASE_CAPABILITY_PARAMETER_MESSAGE =
  "usecase のエクスポート関数は第1引数で権能（capabilities）を受け取る。" +
  "型注釈は usecases/capabilities から import した権能型（`caps: XxxCapabilities`）か、" +
  "それを Pick / Omit 等で包んだ型にする。";

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
        if (node.source?.type !== "Literal") {
          context.report({
            node,
            message: USECASE_UNRESOLVABLE_IMPORT_MESSAGE,
          });
          return;
        }
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

// 権能型かどうかは型名の接尾辞では判定しない。`FakeCaps` のような名前を付けた
// 構造型（raw な db を持つ型）でルールを通過できてしまうため、権能型の定義元
// （usecases/capabilities）から来ている型だけを権能型として認める。
const CAPABILITY_MODULE_SOURCE = /(^|\/)capabilities(\/|$)/;

const isCapabilityModuleSource = (source) =>
  typeof source === "string" &&
  source.startsWith(".") &&
  CAPABILITY_MODULE_SOURCE.test(source);

// typescript-eslint は v8 で TSTypeReference の型引数を typeArguments に移した。
// 旧フィールド名でも動くよう両方を見る。
const typeArgumentsOf = (typeNode) =>
  typeNode.typeArguments ? typeNode.typeArguments : typeNode.typeParameters;

// 名前空間 import（`import type * as caps` → `caps.ArtistWriteCapabilities`）は
// 左端の識別子で判定できるよう、修飾名を左端まで畳む。
const typeReferenceName = (typeNode) => {
  if (!typeNode || typeNode.type !== "TSTypeReference") return null;

  let typeName = typeNode.typeName;
  while (typeName.type === "TSQualifiedName") typeName = typeName.left;
  return typeName.type === "Identifier" ? typeName.name : null;
};

const isCapabilityType = (typeNode, capabilityNames) => {
  const name = typeReferenceName(typeNode);
  if (!name) return false;
  if (capabilityNames.has(name)) return true;
  if (!CAPABILITY_WRAPPER_TYPES.has(name)) return false;

  const typeArguments = typeArgumentsOf(typeNode);
  if (!typeArguments) return false;
  return isCapabilityType(typeArguments.params[0], capabilityNames);
};

const referencesCapabilityType = (node, capabilityNames) => {
  if (!node || typeof node !== "object") return false;
  if (Array.isArray(node)) {
    return node.some((child) =>
      referencesCapabilityType(child, capabilityNames),
    );
  }
  if (capabilityNames.has(typeReferenceName(node))) return true;

  return Object.entries(node).some(
    ([key, value]) =>
      key !== "parent" && referencesCapabilityType(value, capabilityNames),
  );
};

// `type SaveMyProfileCaps = Pick<ArtistWriteCapabilities, ...>` のような
// ファイル内の別名も権能型として扱う。別名が別名を参照する形に備えて
// 増えなくなるまで繰り返す。
const expandCapabilityAliases = (aliases, capabilityNames) => {
  let expanded = true;
  while (expanded) {
    expanded = false;
    for (const alias of aliases) {
      if (capabilityNames.has(alias.name)) continue;
      if (!referencesCapabilityType(alias.typeAnnotation, capabilityNames)) {
        continue;
      }
      capabilityNames.add(alias.name);
      expanded = true;
    }
  }
};

const receivesCapabilities = (fn, capabilityNames) => {
  const [firstParameter] = fn.params;
  if (!firstParameter) return false;
  return isCapabilityType(
    firstParameter.typeAnnotation?.typeAnnotation,
    capabilityNames,
  );
};

const FUNCTION_TYPES = new Set([
  "ArrowFunctionExpression",
  "FunctionExpression",
  "FunctionDeclaration",
]);

const findVariable = (scope, name) => {
  for (let current = scope; current; current = current.upper) {
    const variable = current.set.get(name);
    if (variable) return variable;
  }
  return null;
};

// `export { run }` / `export default run` は宣言そのものを持たないため、
// 束縛先まで辿って関数を取り出す。辿れない（import の再エクスポート・
// 関数以外の値・型）場合は対象外。
const functionOfVariable = (variable) => {
  if (!variable) return null;

  for (const def of variable.defs) {
    if (def.node.type === "FunctionDeclaration") return def.node;
    if (
      def.node.type === "VariableDeclarator" &&
      FUNCTION_TYPES.has(def.node.init?.type)
    ) {
      return def.node.init;
    }
  }
  return null;
};

const exportedFunctionsOf = (node, scope) => {
  const declaration = node.declaration;

  if (declaration) {
    if (FUNCTION_TYPES.has(declaration.type)) return [declaration];
    if (declaration.type === "VariableDeclaration") {
      return declaration.declarations
        .map((declarator) => declarator.init)
        .filter((init) => init && FUNCTION_TYPES.has(init.type));
    }
    if (declaration.type === "Identifier") {
      const fn = functionOfVariable(findVariable(scope, declaration.name));
      return fn ? [fn] : [];
    }
    return [];
  }

  if (!node.specifiers) return [];
  return node.specifiers
    .filter((specifier) => specifier.local?.type === "Identifier")
    .map((specifier) =>
      functionOfVariable(findVariable(scope, specifier.local.name)),
    )
    .filter((fn) => fn !== null);
};

const usecaseCapabilityParameterRule = {
  meta: {
    type: "problem",
    docs: { description: USECASE_CAPABILITY_PARAMETER_MESSAGE },
    schema: [],
  },
  create(context) {
    const sourceCode = context.sourceCode;
    const capabilityNames = new Set();
    const aliases = [];
    const exportedFunctions = new Set();

    const collectExport = (node) => {
      // 再エクスポート（`export { x } from "..."`）は値の定義がこのファイルに無い。
      // 権能を迂回する import 自体は boundary ルールが見る。
      if (node.source) return;
      for (const fn of exportedFunctionsOf(node, sourceCode.getScope(node))) {
        exportedFunctions.add(fn);
      }
    };

    return {
      ImportDeclaration(node) {
        if (!isCapabilityModuleSource(node.source.value)) return;
        for (const specifier of node.specifiers) {
          if (specifier.local?.type !== "Identifier") continue;
          capabilityNames.add(specifier.local.name);
        }
      },
      TSTypeAliasDeclaration(node) {
        aliases.push({
          name: node.id.name,
          typeAnnotation: node.typeAnnotation,
        });
      },
      ExportNamedDeclaration: collectExport,
      ExportDefaultDeclaration: collectExport,
      "Program:exit"() {
        expandCapabilityAliases(aliases, capabilityNames);

        for (const fn of exportedFunctions) {
          if (receivesCapabilities(fn, capabilityNames)) continue;
          context.report({
            node: fn,
            message: USECASE_CAPABILITY_PARAMETER_MESSAGE,
          });
        }
      },
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

// Entity の振る舞いに本番コードの呼び手があるかはファイル単体では判定できないため、
// 同じ src 配下の本番コードを読んで探す（docs/architecture/server/architecture.md
// 「呼び手のない公開面は機械的に検出する」）。
const entityBehaviorMessage = (typeName, memberName) =>
  `Entity \`${typeName}\` の振る舞い \`${memberName}\` に本番コード（テスト・テストダブルを除く）の呼び手が無い。` +
  "呼び手のある振る舞いだけを公開し、必要になった PR で足す。";

const SOURCE_ROOT_MARKER = `${sep}src${sep}domain${sep}`;
const PRODUCTION_SOURCE_PATTERN = /\.tsx?$/;
const NON_PRODUCTION_PATH_PATTERN =
  /(\.test\.tsx?$)|((^|[\\/])testDoubles([\\/]|$))/;

const sourceRootOf = (filename) => {
  const index = filename.indexOf(SOURCE_ROOT_MARKER);
  if (index === -1) return null;
  return filename.slice(0, index + `${sep}src`.length);
};

const listProductionSources = (dir, excluded) => {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listProductionSources(path, excluded));
      continue;
    }
    if (path === excluded) continue;
    if (!PRODUCTION_SOURCE_PATTERN.test(path)) continue;
    if (NON_PRODUCTION_PATH_PATTERN.test(path)) continue;
    files.push(path);
  }
  return files;
};

const isCalledIn = (sources, memberName) => {
  const callPattern = new RegExp(`\\.${memberName}\\s*\\(`);
  return sources.some((source) =>
    callPattern.test(readFileSync(source, "utf8")),
  );
};

const isBehaviorMember = (member) =>
  member.type === "TSMethodSignature" ||
  (member.type === "TSPropertySignature" &&
    member.typeAnnotation?.typeAnnotation?.type === "TSFunctionType");

const behaviorMembersOf = (declaration) => {
  if (declaration.type === "TSTypeAliasDeclaration") {
    if (declaration.typeAnnotation.type !== "TSTypeLiteral") return [];
    return declaration.typeAnnotation.members.filter(isBehaviorMember);
  }
  if (declaration.type === "TSInterfaceDeclaration") {
    return declaration.body.body.filter(isBehaviorMember);
  }
  return [];
};

const entityBehaviorHasCallerRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Entity の公開振る舞いは、本番コードに呼び手があるものだけに限る",
    },
    schema: [],
  },
  create(context) {
    const sourceRoot = sourceRootOf(context.filename);
    if (!sourceRoot) return {};

    let productionSources = null;
    const callers = () => {
      if (!productionSources) {
        productionSources = listProductionSources(sourceRoot, context.filename);
      }
      return productionSources;
    };

    return {
      ExportNamedDeclaration(node) {
        if (!node.declaration) return;
        const typeName = node.declaration.id?.name;
        for (const member of behaviorMembersOf(node.declaration)) {
          if (member.key.type !== "Identifier") continue;
          if (isCalledIn(callers(), member.key.name)) continue;
          context.report({
            node: member,
            message: entityBehaviorMessage(typeName, member.key.name),
          });
        }
      },
    };
  },
};

const entityBehaviorPlugin = {
  rules: {
    "entity-behavior-has-caller": entityBehaviorHasCallerRule,
  },
};

export const entityBehaviorRules = (files) => ({
  files,
  plugins: { local: entityBehaviorPlugin },
  rules: {
    "local/entity-behavior-has-caller": "error",
  },
});

const ROUTE_STATUS_MESSAGE =
  "BFF route で HTTP ステータスを決めない。失敗は型付きエラーを throw し、errorMap が翻訳する（docs/architecture/frontend/bff/design.md「エラー契約」）。成功系（2xx）の明示のみ許可。";

const isSuccessStatusLiteral = (node) =>
  node.type === "Literal" &&
  typeof node.value === "number" &&
  node.value >= 200 &&
  node.value < 300;

const routeStatusRule = {
  meta: {
    type: "problem",
    docs: { description: ROUTE_STATUS_MESSAGE },
    schema: [],
  },
  create(context) {
    return {
      'CallExpression[callee.object.name="c"][callee.property.name="json"][arguments.length>=2]'(
        node,
      ) {
        const status = node.arguments[1];
        if (isSuccessStatusLiteral(status)) return;
        context.report({ node: status, message: ROUTE_STATUS_MESSAGE });
      },
    };
  },
};

export const bffRouteStatusRules = (appDir) => ({
  files: [`${appDir}/src/app/api/**/*.ts`],
  ignores: [`${appDir}/src/app/api/**/*.test.ts`],
  plugins: {
    "local-bff": { rules: { "no-status-in-route": routeStatusRule } },
  },
  rules: { "local-bff/no-status-in-route": "error" },
});
