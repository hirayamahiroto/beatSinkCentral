#!/usr/bin/env node
// scripts/test-audit/index.mjs
// テスト戦略（docs/architecture/testing/strategy.md, background.md）への準拠率を機械的に測る。
// 依存なし。`node scripts/test-audit/index.mjs [--json] [--strict] [--root <dir>]`
//
//   --json    Markdown の代わりに JSON を出す（ダッシュボード / 推移記録用）
//   --strict  構造違反（純粋モジュールのモック、型なし殻モック）が 1 件でもあれば exit 1（CI ゲート用）

import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
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
// -------------------------------------------------------------------

const walk = (dir, out = []) => {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next" || name === "dist")
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

const tests = files.filter(isTest);
const sources = files.filter(isSource);

const itTitles = (src) =>
  [...src.matchAll(/\bit(?:\.each\([^)]*\))?\(\s*["'`]([^"'`]+)["'`]/g)].map(
    (m) => m[1],
  );

// ---------- 指標 1: 純粋モジュールのモック ----------
const pureModuleMocks = [];
for (const t of tests) {
  const src = read(t);
  for (const m of src.matchAll(/vi\.mock\(\s*["']([^"']+)["']/g)) {
    const target = m[1];
    const resolved = target.startsWith(".")
      ? "/" + rel(resolve(dirname(t), target))
      : "/" + target;
    if (PURE_SEGMENTS.some((s) => resolved.includes(s))) {
      pureModuleMocks.push({ file: rel(t), target });
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
const mockTypingOf = (src) => ({
  untyped:
    (src.match(/:\s*vi\.fn\(\)/g) ?? []).length +
    (src.match(/=\s*vi\.fn\(\)/g) ?? []).length,
  typed: (src.match(/vi\.fn</g) ?? []).length,
  satisfies: /\bsatisfies\b/.test(src),
});
const shellMockTyping = {};
for (const t of tests) {
  const layer = LAYER_OF("/" + rel(t));
  if (!COMPOSITION_LAYERS.has(layer)) continue;
  const src = read(t);
  const local = mockTypingOf(src);
  const helpers = [...src.matchAll(/from\s+["']([^"']+)["']/g)]
    .map((m) => m[1])
    .filter((s) => HELPER_PATH.test(s))
    .map((s) => resolveImport(t, s))
    .filter(Boolean);
  const helperTyping = helpers.map((h) => mockTypingOf(read(h)));
  const usesMock =
    local.untyped + local.typed > 0 ||
    /vi\.mock\(/.test(src) ||
    helpers.length > 0;
  if (!usesMock) continue;
  const helperOk =
    helperTyping.length > 0 &&
    helperTyping.every((h) => h.untyped === 0 && (h.typed > 0 || h.satisfies));
  const localOk = local.untyped === 0 && (local.typed > 0 || local.satisfies);
  const ok = local.untyped === 0 && (localOk || helperOk);
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
let fixtureFromFactory = 0;
let fixtureLiteral = 0;
const fixtureLiteralFiles = new Set();
for (const t of tests) {
  const layer = LAYER_OF("/" + rel(t));
  if (!COMPOSITION_LAYERS.has(layer)) continue;
  const src = read(t);
  for (const m of src.matchAll(
    /mockResolvedValue(?:Once)?\(\s*([A-Za-z_$][\w$]*|\{)/g,
  )) {
    const head = m[1];
    if (head === "{") {
      fixtureLiteral += 1;
      fixtureLiteralFiles.add(rel(t));
    } else if (FACTORY_PREFIXES.some((p) => head.startsWith(p))) {
      fixtureFromFactory += 1;
    }
  }
}

// ---------- 指標 4: テストのないモジュール ----------
const isTypeOnlyOrBarrel = (src) => {
  const lines = src
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("//"));
  return lines.every(
    (l) =>
      /^(import|export)\b.*\bfrom\b/.test(l) ||
      /^export\s+(type|interface)\b/.test(l) ||
      /^(export\s+)?(type|interface)\b/.test(l) ||
      /^[}\]);]*$/.test(l) ||
      /^[A-Za-z_$][\w$]*\??:\s/.test(l) || // interface のメンバ行
      /^(readonly\s+)?[A-Za-z_$][\w$]*\s*\(.*\)\s*:/.test(l) || // メソッドシグネチャ
      /^\|/.test(l) ||
      /^[<>=&|]/.test(l),
  );
};
const missingTests = [];
for (const s of sources) {
  const dir = dirname(s);
  if (
    existsSync(join(dir, "index.test.ts")) ||
    existsSync(join(dir, "index.test.tsx"))
  )
    continue;
  const src = read(s);
  if (isTypeOnlyOrBarrel(src)) continue;
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
  const src = read(t);
  const titles = itTitles(src);
  const invalid = titles.filter((x) => /不正|無効|超える|形式|書式/.test(x));
  const reasons = [];
  if (invalid.length >= 3)
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
  const src = read(t);
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
  const src = read(s);
  const hasClock = /new Date\(\)|Date\.now\(\)/.test(src);
  const hasRandom = /randomUUID\(\)|Math\.random\(\)/.test(src);
  if (!hasClock && !hasRandom) continue;
  const layer = LAYER_OF("/" + rel(s));
  const t = [
    join(dirname(s), "index.test.ts"),
    join(dirname(s), "index.test.tsx"),
  ].find(existsSync);
  const tsrc = t ? read(t) : "";
  const controlled = /useFakeTimers|setSystemTime|spyOn\(\s*crypto/.test(tsrc);
  clockLeaks.push({
    file: rel(s),
    layer,
    clock: hasClock,
    random: hasRandom,
    testControls: controlled,
    inPureLayer: layer === "domain" || layer === "usecase",
  });
}

// ---------- 指標 8: 殻の契約カバー率（モックの台本 vs 統合テスト） ----------
// usecase / route テストで台本化されたリポジトリメソッドごとに、integration test にケースがあるか
const scripts = {}; // method -> Set(files)
for (const t of tests) {
  const layer = LAYER_OF("/" + rel(t));
  if (layer !== "usecase" && layer !== "route") continue;
  const src = read(t);
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
    literal: fixtureLiteral,
    ratio:
      fixtureFromFactory + fixtureLiteral
        ? +(fixtureFromFactory / (fixtureFromFactory + fixtureLiteral)).toFixed(
            2,
          )
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

if (flag("--json")) {
  console.log(JSON.stringify(summary, null, 2));
} else {
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
    `| C. フィクスチャの factory 導出率 | ${fixtureFromFactory}/${fixtureFromFactory + fixtureLiteral} (${pct(summary.fixtureDerivation.ratio)}) | 100% |`,
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
    `| 時刻・乱数を直接呼ぶ純粋層モジュール | ${clockLeaks.filter((c) => c.inPureLayer).length} | 0 |`,
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
        `${x.file} [${x.layer}] ${x.clock ? "Date " : ""}${x.random ? "random " : ""}${x.testControls ? "(テストで制御あり)" : "(テストで制御なし)"}`,
    ),
  );
  section(
    "テストのないモジュール",
    missingTests.map((x) => `${x.file} [${x.layer}] ${x.lines} 行`),
  );
  console.log(lines.join("\n"));
}

if (flag("--strict")) {
  const untypedTotal = Object.values(shellMockTyping).reduce(
    (n, v) => n + v.files.length,
    0,
  );
  if (pureModuleMocks.length > 0 || untypedTotal > 0) process.exit(1);
}
