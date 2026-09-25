#!/usr/bin/env node
// scripts/doc-links/index.mjs
// ドキュメント間の参照切れを検出する。1 件でもあれば exit 1。
// 依存なし。`node scripts/doc-links/index.mjs [--json] [--root <dir>]`
//
//   1. Markdown リンク `[text](path#anchor)` … 全 .md。ファイルと見出しアンカーの両方を確かめる
//   2. バッククォートのパス `docs/…` `.claude/…` `scripts/…` … 規範のドキュメントだけ（下記の除外を参照）
//   3. コード中の `docs/…` `.claude/…` … .ts / .tsx / .mjs / .mts / .yml のコメントや文字列

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, normalize, relative, resolve, sep } from "node:path";

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const ROOT = resolve(opt("--root", process.cwd()));

// ---------- 設定 ----------
const PATH_PREFIXES = ["docs/", ".claude/", "scripts/"];
const CODE_PATH_PREFIXES = ["docs/", ".claude/"];
const CODE_GLOBS = ["*.ts", "*.tsx", "*.mjs", "*.mts", "*.yml", "*.yaml"];
// 規範でない（CLAUDE.md「ドキュメントの構成」）ため、消えたファイルや未作成のファイルに言及してよい場所。
// Markdown リンクはここでも確かめる（クリックできるリンクは常に辿れるべき）
const PATH_EXEMPT = [/^docs\/adr\//, /^docs\/plans\//, /^docs\/discussions\//];
// `docs/...` のような書式の例示・glob・変数はパスではない
const PLACEHOLDER = /\.\.\.|…|[*{}<>$]/;
// -------------------------

const git = (...a) =>
  execFileSync("git", a, { cwd: ROOT, encoding: "utf8" }).trim();
const listFiles = (...globs) =>
  git("ls-files", "--", ...globs)
    .split("\n")
    .filter(Boolean)
    // 自分自身のテストは、検出させるための参照切れを文字列で持つ
    .filter((f) => f !== "scripts/doc-links/index.test.mjs");

const toPosix = (p) => p.split(sep).join("/");
const abs = (p) => join(ROOT, p);
const exists = (p) => existsSync(abs(p));
const isIgnored = (p) => {
  try {
    execFileSync("git", ["check-ignore", "-q", p], { cwd: ROOT });
    return true;
  } catch {
    return false;
  }
};

// フェンス内は検査しない。行番号を保つため改行は残す
const blankFences = (src) =>
  src.replace(/^(```|~~~)[\s\S]*?^\1/gm, (m) => m.replace(/[^\n]/g, " "));
const lineOf = (src, index) => src.slice(0, index).split("\n").length;

// GitHub の見出しアンカー: 小文字化し、文字・数字・結合文字・`_`・空白・`-` 以外を落とし、空白を `-` にする
const slugOf = (heading) =>
  heading
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\p{Pc} -]/gu, "")
    .replace(/ /g, "-");

const anchorCache = new Map();
const anchorsOf = (file) => {
  if (anchorCache.has(file)) return anchorCache.get(file);
  const src = blankFences(readFileSync(abs(file), "utf8"));
  const anchors = new Set();
  const seen = new Map();
  for (const m of src.matchAll(/^#{1,6}[ \t]+(.+?)[ \t]*#*[ \t]*$/gm)) {
    const slug = slugOf(m[1]);
    const n = seen.get(slug) ?? 0;
    seen.set(slug, n + 1);
    anchors.add(n === 0 ? slug : `${slug}-${n}`);
  }
  for (const m of src.matchAll(/<a\s+(?:name|id)=["']([^"']+)["']/g)) {
    anchors.add(m[1]);
  }
  anchorCache.set(file, anchors);
  return anchors;
};

const decode = (s) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

const broken = [];
const report = (file, src, index, target, reason) =>
  broken.push({ file, line: lineOf(src, index), target, reason });

// ---------- 1. Markdown リンク ----------
const markdownFiles = listFiles("*.md");
for (const file of markdownFiles) {
  const src = blankFences(readFileSync(abs(file), "utf8"));
  const links = [
    ...src.matchAll(/\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g),
    ...src.matchAll(
      /^[ \t]*\[[^\]]+\]:[ \t]*<?(\S+?)>?(?:[ \t]+"[^"]*")?[ \t]*$/gm,
    ),
  ];
  for (const m of links) {
    const target = m[1];
    if (/^[a-z][a-z0-9+.-]*:/i.test(target)) continue; // http:, mailto: など
    const [rawPath, rawAnchor] = target.split("#");
    const path = decode(rawPath);
    const resolved = path
      ? toPosix(
          path.startsWith("/")
            ? normalize(path.slice(1))
            : normalize(join(dirname(file), path)),
        )
      : file;
    if (!exists(resolved)) {
      report(file, src, m.index, target, "ファイルが無い");
      continue;
    }
    if (
      rawAnchor &&
      resolved.endsWith(".md") &&
      statSync(abs(resolved)).isFile() &&
      !anchorsOf(resolved).has(decode(rawAnchor).toLowerCase())
    ) {
      report(file, src, m.index, target, "見出しが無い");
    }
  }
}

// ---------- 2. バッククォートのパス（規範のドキュメント） ----------
const inlinePath = new RegExp(
  "`((?:" +
    PATH_PREFIXES.map((p) => p.replace(/\./g, "\\.")).join("|") +
    ")[^`\\s#:]*)(?:[#:][^`]*)?`",
  "g",
);
for (const file of markdownFiles) {
  if (PATH_EXEMPT.some((re) => re.test(file))) continue;
  const src = blankFences(readFileSync(abs(file), "utf8"));
  for (const m of src.matchAll(inlinePath)) {
    const path = m[1];
    if (PLACEHOLDER.test(path) || exists(path) || isIgnored(path)) continue;
    report(file, src, m.index, path, "パスが無い");
  }
}

// ---------- 3. コード中のドキュメント参照 ----------
const codePath = new RegExp(
  "(?<![\\w/.-])((?:" +
    CODE_PATH_PREFIXES.map((p) => p.replace(/\./g, "\\.")).join("|") +
    ")[\\w./\\-\\[\\]]*[\\w/])",
  "g",
);
for (const file of listFiles(...CODE_GLOBS)) {
  const src = readFileSync(abs(file), "utf8");
  for (const m of src.matchAll(codePath)) {
    const path = m[1];
    if (PLACEHOLDER.test(path) || exists(path) || isIgnored(path)) continue;
    report(file, src, m.index, path, "パスが無い");
  }
}

// ---------- 出力 ----------
if (args.includes("--json")) {
  console.log(JSON.stringify({ broken }, null, 2));
} else if (broken.length === 0) {
  console.log(
    `doc-links: 参照切れなし（${toPosix(relative(process.cwd(), ROOT)) || "."}）`,
  );
} else {
  for (const b of broken) {
    console.log(`${b.file}:${b.line}  ${b.target}  （${b.reason}）`);
  }
  console.log(`\ndoc-links: 参照切れ ${broken.length} 件`);
}
if (broken.length > 0) process.exitCode = 1;
