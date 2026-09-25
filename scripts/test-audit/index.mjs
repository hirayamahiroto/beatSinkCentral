#!/usr/bin/env node
// scripts/test-audit/index.mjs
// テスト戦略（docs/architecture/testing/strategy.md, background.md）への準拠率を機械的に測る。
// 依存なし。`node scripts/test-audit/index.mjs [--json] [--strict] [--root <dir>]`
//
//   --json    Markdown の代わりに JSON を出す（ダッシュボード / 推移記録用）
//   --strict  構造違反（純粋モジュールのモック、型なし殻モック）が 1 件でもあれば exit 1（CI ゲート用）
//   --out <dir>  日時付きの .md / .json と latest.md / latest.json を <dir> に書き出す（ローカルで推移を溜める用）

import {
  readdirSync,
  readFileSync,
  existsSync,
  statSync,
  mkdirSync,
  writeFileSync,
} from "node:fs";
import { execSync } from "node:child_process";
import { join, dirname, resolve, relative, sep } from "node:path";

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const ROOT = resolve(opt("--root", process.cwd()));

// ---------- 設定（プロジェクト構造に合わせてここだけ変える） ----------
const SCAN_DIRS = ["apps", "packages"];
const PURE_SEGMENTS = ["/domain/", "/usecases/"]; // ここをモックしたら違反
const LAYER_OF = (rel) => {
  if (/\/errors\//.test(rel)) return "error"; // Error 定義は message 検証が責務（§4）
  if (/\/(validators|middlewares|shared)\//.test(rel)) return "support";
  if (/\/app\/api\//.test(rel))
    return rel.includes("/apps/api-server/") ? "route" : "bff";
  if (/\/usecases\//.test(rel)) return "usecase";
  if (/\/domain\//.test(rel)) return "domain";
  if (/\/infrastructure\/repositories\//.test(rel)) return "repository";
  if (/\/fetchers\//.test(rel)) return "fetcher";
  if (/\/hooks\//.test(rel)) return "hook";
  return "other";
};
const COMPOSITION_LAYERS = new Set(["route", "usecase", "bff", "hook"]);
const FACTORY_PREFIXES = ["reconstruct", "create", "build"];
// テストを書かない対象（strategy.md §11 / ADR 0004 / ADR 0005）
const NO_TEST_EXEMPT = [
  /\/testDoubles\//,
  /^packages\/ui\//,
  /\/libs\/auth0\//,
  /\/utils\/config\//,
  /\/infrastructure\/(auth0|database|storage|appBaseUrl)\//,
  /^packages\/database\/src\/utils\/createClient\//,
];
// -------------------------------------------------------------------

const walk = (dir, out = []) => {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (
      name === "node_modules" ||
      name === ".next" ||
      name === "dist" ||
      name === ".stryker-tmp"
    )
      continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
};

const files = SCAN_DIRS.flatMap((d) => walk(join(ROOT, d)));
const rel = (p) => relative(ROOT, p).split(sep).join("/");
const isTest = (p) => /\.test\.tsx?$/.test(p);
const isSource = (p) => /(^|\/)index\.tsx?$/.test(rel(p)) && !isTest(p);
const read = (p) => readFileSync(p, "utf8");
const stripComments = (src) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
// コメントに残った `vi.mock(...)` 等を違反として数えないよう、判定はコメントを除いた本文で行う
const readCode = (p) => stripComments(read(p));

const tests = files.filter(isTest);
const sources = files.filter(isSource);

const itTitles = (src) =>
  [...src.matchAll(/\bit(?:\.each\([^)]*\))?\(\s*["'`]([^"'`]+)["'`]/g)].map(
    (m) => m[1],
  );

// ---------- 指標 1: 純粋モジュールのモック ----------
// vi.mock / vi.doMock（文字列でも import() でも）と、純粋モジュールから import した束縛への vi.spyOn を数える。
// 確定の違反は ESLint（local-test/no-pure-module-double）でも止めている。ここは推移の記録用。
const isPureTarget = (from, target) => {
  const resolved = target.startsWith(".")
    ? "/" + rel(resolve(dirname(from), target))
    : "/" + target;
  const probe = resolved.endsWith("/") ? resolved : resolved + "/";
  return PURE_SEGMENTS.some((s) => probe.includes(s));
};
const pureModuleMocks = [];
for (const t of tests) {
  const src = readCode(t);
  for (const m of src.matchAll(
    /vi\.(?:mock|doMock)\(\s*(?:import\(\s*)?["']([^"']+)["']/g,
  )) {
    if (isPureTarget(t, m[1])) {
      pureModuleMocks.push({ file: rel(t), target: m[1] });
    }
  }
  const pureBindings = [];
  for (const m of src.matchAll(
    /import\s+(?!type\b)([\s\S]*?)\s+from\s+["']([^"']+)["']/g,
  )) {
    if (!isPureTarget(t, m[2])) continue;
    pureBindings.push(
      ...m[1]
        .replace(/[{}]/g, ",")
        .split(",")
        .map((s) =>
          s
            .trim()
            .split(/\s+as\s+/)
            .pop()
            .replace(/^\*\s*/, ""),
        )
        .filter((s) => /^[A-Za-z_$][\w$]*$/.test(s)),
    );
  }
  for (const m of src.matchAll(/vi\.spyOn\(\s*([A-Za-z_$][\w$]*)/g)) {
    if (pureBindings.includes(m[1])) {
      pureModuleMocks.push({ file: rel(t), target: `vi.spyOn(${m[1]})` });
    }
  }
}

// ---------- 指標 2: 殻モックの型付き率（合成点のみ） ----------
// 共有の test double（*/testDoubles/*, */fixtures/*）を import している場合はそのモジュールの型付けを見る
const HELPER_PATH = /\/(testDoubles|fixtures|test-doubles)(\/|$)/;
const resolveImport = (from, spec) => {
  if (!spec.startsWith(".")) return null;
  const base = resolve(dirname(from), spec);
  for (const c of [
    base + ".ts",
    base + ".tsx",
    join(base, "index.ts"),
    join(base, "index.tsx"),
  ]) {
    if (existsSync(c)) return c;
  }
  return null;
};
const RETURN_TYPE_ANNOTATED = /\)\s*:\s*[^=;{}]+=>\s*$/;
// `vi.fn<` 直後の型引数を、`=>` の `>` を数えずに対応する `>` まで切り出す
const typeArgumentAt = (src, start) => {
  let depth = 1;
  for (let i = start; i < src.length; i += 1) {
    const ch = src[i];
    if (ch === "<") depth += 1;
    else if (ch === ">" && src[i - 1] !== "=") {
      depth -= 1;
      if (depth === 0) return src.slice(start, i);
    }
  }
  return src.slice(start);
};
const mockTypingOf = (src) => {
  let untyped = 0;
  let typed = 0;
  for (const m of src.matchAll(/vi\.fn</g)) {
    // vi.fn<any> は型引数があっても契約に縛られていない
    if (/\bany\b/.test(typeArgumentAt(src, m.index + m[0].length)))
      untyped += 1;
    else typed += 1;
  }
  for (const m of src.matchAll(/vi\.fn\(/g)) {
    const before = src.slice(Math.max(0, m.index - 200), m.index);
    if (RETURN_TYPE_ANNOTATED.test(before)) typed += 1;
    else untyped += 1;
  }
  return { untyped, typed, satisfies: /\bsatisfies\b/.test(src) };
};
const shellMockTyping = {};
for (const t of tests) {
  const layer = LAYER_OF("/" + rel(t));
  if (!COMPOSITION_LAYERS.has(layer)) continue;
  const src = readCode(t);
  const local = mockTypingOf(src);
  const helpers = [...src.matchAll(/from\s+["']([^"']+)["']/g)]
    .map((m) => m[1])
    .filter((s) => HELPER_PATH.test(s))
    .map((s) => resolveImport(t, s))
    .filter(Boolean);
  const helperTyping = helpers
    .map((h) => mockTypingOf(readCode(h)))
    .filter((h) => h.untyped + h.typed > 0);
  const usesMock =
    local.untyped + local.typed > 0 ||
    /vi\.mock\(/.test(src) ||
    helperTyping.length > 0;
  if (!usesMock) continue;
  const helperUntyped = helperTyping.some((h) => h.untyped > 0);
  const localOk = local.untyped === 0 && (local.typed > 0 || local.satisfies);
  const ok =
    local.untyped === 0 &&
    !helperUntyped &&
    (localOk || helperTyping.length > 0);
  shellMockTyping[layer] ??= { total: 0, typed: 0, files: [] };
  shellMockTyping[layer].total += 1;
  if (ok) shellMockTyping[layer].typed += 1;
  else
    shellMockTyping[layer].files.push({
      file: rel(t),
      ...local,
      viaHelper: helpers.map(rel),
    });
}

// ---------- 指標 3: フィクスチャの factory 導出率 ----------
// 判別子だけを持ち、残りが参照（factory で作った値を指す識別子）だけのリテラルは
// 「封筒」として数える。例: `{ status: "complete", actor }` / `{ ok: true, value }`。
// 中身は factory 由来で、形は殻の戻り値型が縛るため、手書きフィクスチャではない。
const DISCRIMINANT_ENTRY =
  /^(status|kind|ok|type)\s*:\s*("[^"]*"|'[^']*'|true|false)$/;
const REFERENCE_ENTRY = /^([A-Za-z_$][\w$]*\s*:\s*)?[A-Za-z_$][\w$]*$/;
const balancedBlockAt = (src, open) => {
  let depth = 0;
  for (let i = open; i < src.length; i += 1) {
    if ("{[(".includes(src[i])) depth += 1;
    else if ("}])".includes(src[i])) {
      depth -= 1;
      if (depth === 0) return src.slice(open + 1, i);
    }
  }
  return src.slice(open + 1);
};
const topLevelEntries = (body) => {
  const entries = [];
  let depth = 0;
  let current = "";
  for (const ch of body) {
    if ("{[(".includes(ch)) depth += 1;
    else if ("}])".includes(ch)) depth -= 1;
    if (ch === "," && depth === 0) {
      entries.push(current.trim());
      current = "";
    } else current += ch;
  }
  if (current.trim()) entries.push(current.trim());
  return entries;
};
// `actor: { user, artist }` のように、参照だけを束ねた入れ子も参照として扱う
const NESTED_ENTRY = /^[A-Za-z_$][\w$]*\s*:\s*\{([\s\S]*)\}$/;
const isReferenceEntry = (entry) => {
  if (REFERENCE_ENTRY.test(entry)) return true;
  const nested = entry.match(NESTED_ENTRY);
  return (
    nested !== null &&
    topLevelEntries(nested[1]).every((e) => isReferenceEntry(e))
  );
};
const isEnvelopeLiteral = (body) => {
  const entries = topLevelEntries(body);
  return (
    entries.some((e) => DISCRIMINANT_ENTRY.test(e)) &&
    entries.every((e) => DISCRIMINANT_ENTRY.test(e) || isReferenceEntry(e))
  );
};
let fixtureFromFactory = 0;
let fixtureEnvelope = 0;
let fixtureLiteral = 0;
const fixtureLiteralFiles = new Set();
for (const t of tests) {
  const layer = LAYER_OF("/" + rel(t));
  if (!COMPOSITION_LAYERS.has(layer)) continue;
  const src = readCode(t);
  for (const m of src.matchAll(
    /mockResolvedValue(?:Once)?\(\s*([A-Za-z_$][\w$]*|\{)/g,
  )) {
    const head = m[1];
    if (head === "{") {
      const open = m.index + m[0].length - 1;
      if (isEnvelopeLiteral(balancedBlockAt(src, open))) {
        fixtureEnvelope += 1;
      } else {
        fixtureLiteral += 1;
        fixtureLiteralFiles.add(rel(t));
      }
    } else if (FACTORY_PREFIXES.some((p) => head.startsWith(p))) {
      fixtureFromFactory += 1;
    }
  }
}

// ---------- 指標 4: テストのないモジュール ----------
const isTypeOnlyOrBarrel = (src) => {
  const code = stripComments(src);
  return (
    !/\b(const|let|var|function|class|enum)\b/.test(code) &&
    !/export\s+default\b/.test(code)
  );
};
const isMountOnlyRoute = (src) =>
  /\.route\(/.test(src) && !/\.(get|post|put|patch|delete|all)\(/.test(src);
const isPassThroughClientAdapter = (relPath, src) =>
  /ClientAdapter\/index\.tsx$/.test(relPath) && !/\buse[A-Z]\w*\(/.test(src);
const missingTests = [];
for (const s of sources) {
  const dir = dirname(s);
  if (
    existsSync(join(dir, "index.test.ts")) ||
    existsSync(join(dir, "index.test.tsx"))
  )
    continue;
  const src = read(s);
  const relPath = rel(s);
  if (NO_TEST_EXEMPT.some((re) => re.test(relPath))) continue;
  if (isTypeOnlyOrBarrel(src)) continue;
  if (isMountOnlyRoute(src)) continue;
  if (isPassThroughClientAdapter(relPath, src)) continue;
  missingTests.push({
    file: rel(s),
    layer: LAYER_OF("/" + rel(s)),
    lines: src.split("\n").length,
  });
}

// ---------- 指標 5: 責務漏れの疑い（合成点が下層の規則を再検証） ----------
const leakageSuspects = [];
for (const t of tests) {
  const layer = LAYER_OF("/" + rel(t));
  if (!COMPOSITION_LAYERS.has(layer)) continue;
  const src = readCode(t);
  const titles = itTitles(src);
  const invalid = titles.filter((x) => /不正|無効|超える|形式|書式/.test(x));
  const reasons = [];
  if (invalid.length >= 3 && layer === "usecase")
    reasons.push(`異常系バリエーション ${invalid.length} 件`);
  if (/error\.message\)\.to(Be|Match|Contain)/.test(src))
    reasons.push("error.message を検証");
  if (/status\)?\.toBe\(\s*\d{3}/.test(src) && layer === "usecase")
    reasons.push("usecase で HTTP status を検証");
  if (reasons.length) leakageSuspects.push({ file: rel(t), reasons });
}

// ---------- 指標 6: Repository テストのビルダ呼び出し検証 ----------
const builderCallAsserts = [];
for (const t of tests) {
  if (LAYER_OF("/" + rel(t)) !== "repository") continue;
  const src = readCode(t);
  const n = (src.match(/toHaveBeenCalledTimes/g) ?? []).length;
  const chains = (
    src.match(
      /mockResolvedValueOnce\([^)]*\)\s*\.\s*mockResolvedValueOnce/gs,
    ) ?? []
  ).length;
  if (n || chains)
    builderCallAsserts.push({
      file: rel(t),
      calledTimes: n,
      onceChains: chains,
    });
}

// ---------- 指標 7: 時刻・乱数の漏れ ----------
const clockLeaks = [];
for (const s of sources) {
  const src = readCode(s);
  const hasClock = /new Date\(\)|Date\.now\(\)/.test(src);
  const hasUuid = /randomUUID\(\)/.test(src);
  const hasMathRandom = /Math\.random\(\)/.test(src);
  const hasRandom = hasUuid || hasMathRandom;
  if (!hasClock && !hasRandom) continue;
  const layer = LAYER_OF("/" + rel(s));
  const t = [
    join(dirname(s), "index.test.ts"),
    join(dirname(s), "index.test.tsx"),
  ].find(existsSync);
  const tsrc = t ? readCode(t) : "";
  const controlled = /useFakeTimers|setSystemTime|spyOn\(\s*crypto/.test(tsrc);
  clockLeaks.push({
    file: rel(s),
    layer,
    clock: hasClock,
    random: hasRandom,
    testControls: controlled,
    violation:
      (layer === "domain" && (hasClock || hasMathRandom)) ||
      (layer === "usecase" && hasMathRandom),
  });
}

// ---------- 指標 8: 殻の契約カバー率（モックの台本 vs 統合テスト） ----------
// usecase / route テストで台本化されたリポジトリメソッドごとに、integration test にケースがあるか
const scripts = {}; // method -> Set(files)
for (const t of tests) {
  const layer = LAYER_OF("/" + rel(t));
  if (layer !== "usecase" && layer !== "route") continue;
  const src = readCode(t);
  for (const m of src.matchAll(
    /\b([a-zA-Z]\w*)\.(mockResolvedValue|mockRejectedValue|mockResolvedValueOnce|mockImplementation)\(/g,
  )) {
    (scripts[m[1]] ??= new Set()).add(rel(t));
  }
}
const integrationTests = files.filter((p) =>
  /\.integration\.test\.tsx?$/.test(p),
);
const integrationSrc = integrationTests.map(read).join("\n");
const contractCoverage = Object.entries(scripts)
  .filter(([m]) => !/^(mock|fetch|push|refresh)/.test(m))
  .map(([method, fs]) => ({
    method,
    scriptedIn: fs.size,
    coveredByIntegration: new RegExp(`\\b${method}\\b`).test(integrationSrc),
  }));

// ---------- 出力 ----------
const summary = {
  totals: {
    testFiles: tests.length,
    sourceModules: sources.length,
    integrationTestFiles: integrationTests.length,
  },
  pureModuleMocks,
  shellMockTyping: Object.fromEntries(
    Object.entries(shellMockTyping).map(([k, v]) => [
      k,
      {
        total: v.total,
        typed: v.typed,
        ratio: v.total ? +(v.typed / v.total).toFixed(2) : null,
        untypedFiles: v.files,
      },
    ]),
  ),
  fixtureDerivation: {
    fromFactory: fixtureFromFactory,
    envelope: fixtureEnvelope,
    literal: fixtureLiteral,
    ratio:
      fixtureFromFactory + fixtureEnvelope + fixtureLiteral
        ? +(
            (fixtureFromFactory + fixtureEnvelope) /
            (fixtureFromFactory + fixtureEnvelope + fixtureLiteral)
          ).toFixed(2)
        : null,
    literalFiles: [...fixtureLiteralFiles],
  },
  missingTests,
  leakageSuspects,
  builderCallAsserts,
  clockLeaks,
  contractCoverage: {
    scriptedMethods: contractCoverage.length,
    covered: contractCoverage.filter((c) => c.coveredByIntegration).length,
    items: contractCoverage,
  },
};

const renderMarkdown = () => {
  const pct = (r) => (r == null ? "-" : `${Math.round(r * 100)}%`);
  const lines = [];
  lines.push(
    `# テスト戦略 準拠レポート`,
    ``,
    `対象: テスト ${tests.length} / モジュール ${sources.length} / 統合テスト ${integrationTests.length}`,
    ``,
  );
  lines.push(`| 指標 | 値 | 目標 |`, `|---|---|---|`);
  lines.push(
    `| A. 純粋モジュールをモックしているテスト | ${pureModuleMocks.length} | 0 |`,
  );
  for (const [layer, v] of Object.entries(summary.shellMockTyping)) {
    lines.push(
      `| B. 殻モックの型付き率（${layer}） | ${v.typed}/${v.total} (${pct(v.ratio)}) | 100% |`,
    );
  }
  lines.push(
    `| C. フィクスチャの factory 導出率（封筒 ${fixtureEnvelope} を含む） | ${fixtureFromFactory + fixtureEnvelope}/${fixtureFromFactory + fixtureEnvelope + fixtureLiteral} (${pct(summary.fixtureDerivation.ratio)}) | 100% |`,
  );
  lines.push(
    `| D. 責務漏れの疑い（合成点） | ${leakageSuspects.length} | 0（要レビュー） |`,
  );
  lines.push(
    `| E. 殻の契約カバー率（台本 → 統合テスト） | ${summary.contractCoverage.covered}/${summary.contractCoverage.scriptedMethods} | 100% |`,
  );
  lines.push(
    `| Repository テストのビルダ呼び出し検証 | ${builderCallAsserts.length} ファイル | 0 |`,
  );
  lines.push(
    `| 時刻・乱数を直接呼ぶ純粋層モジュール | ${clockLeaks.filter((c) => c.violation).length} | 0 |`,
  );
  lines.push(`| テストのないモジュール | ${missingTests.length} | 0 |`);
  lines.push(``);

  const section = (title, rows) => {
    if (!rows.length) return;
    lines.push(`## ${title}`, ``);
    for (const r of rows) lines.push(`- ${r}`);
    lines.push(``);
  };
  section(
    "A. 純粋モジュールのモック",
    pureModuleMocks.map((x) => `${x.file} → \`${x.target}\``),
  );
  section(
    "B. 型なしの殻モック",
    Object.values(shellMockTyping).flatMap((v) =>
      v.files.map(
        (f) =>
          `${f.file}（型なし ${f.untyped} / 型付き ${f.typed} / satisfies ${f.satisfies ? "有" : "無"}${f.viaHelper?.length ? " / helper: " + f.viaHelper.join(", ") : ""}）`,
      ),
    ),
  );
  section("C. オブジェクトリテラルで集約を渡している合成点テスト", [
    ...fixtureLiteralFiles,
  ]);
  section(
    "D. 責務漏れの疑い",
    leakageSuspects.map((x) => `${x.file}: ${x.reasons.join(" / ")}`),
  );
  section(
    "E. 台本はあるが統合テストにない殻のメソッド",
    contractCoverage
      .filter((c) => !c.coveredByIntegration)
      .map((c) => `${c.method}（${c.scriptedIn} ファイルで台本化）`),
  );
  section(
    "Repository テストのビルダ呼び出し検証",
    builderCallAsserts.map(
      (x) =>
        `${x.file}: toHaveBeenCalledTimes ${x.calledTimes} / Once 連鎖 ${x.onceChains}`,
    ),
  );
  section(
    "時刻・乱数の直接呼び出し",
    clockLeaks.map(
      (x) =>
        `${x.file} [${x.layer}] ${x.clock ? "Date " : ""}${x.random ? "random " : ""}${x.testControls ? "(テストで制御あり)" : "(テストで制御なし)"}${x.violation ? " ← 違反" : ""}`,
    ),
  );
  section(
    "テストのないモジュール",
    missingTests.map((x) => `${x.file} [${x.layer}] ${x.lines} 行`),
  );
  return lines.join("\n");
};

const markdown = renderMarkdown();
const outDir = opt("--out", null);
if (outDir) {
  const dir = resolve(ROOT, outDir);
  mkdirSync(dir, { recursive: true });
  const recordedAt = new Date();
  const stamp = recordedAt.toISOString().slice(0, 19).replace(/:/g, "-");
  const commit = execSync("git rev-parse --short HEAD", { cwd: ROOT })
    .toString()
    .trim();
  const json = JSON.stringify(
    { recordedAt: recordedAt.toISOString(), commit, ...summary },
    null,
    2,
  );
  for (const [name, body] of [
    [`${stamp}.md`, markdown],
    [`${stamp}.json`, json],
    ["latest.md", markdown],
    ["latest.json", json],
  ]) {
    writeFileSync(join(dir, name), body + "\n");
  }
  console.log(
    `wrote ${relative(ROOT, dir)}/${stamp}.{md,json} (commit ${commit})`,
  );
} else if (flag("--json")) {
  console.log(JSON.stringify(summary, null, 2));
} else {
  console.log(markdown);
}

if (flag("--strict")) {
  const untypedTotal = Object.values(shellMockTyping).reduce(
    (n, v) => n + v.files.length,
    0,
  );
  if (pureModuleMocks.length > 0 || untypedTotal > 0) process.exitCode = 1;
}
