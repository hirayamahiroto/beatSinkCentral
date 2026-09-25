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

// 追跡済みに加えて未追跡（gitignore 以外）も見る。add 前の新規ファイルをローカルで取りこぼさない
// -z: 既定では日本語などのパスが引用・エスケープされ、実在するパスとして扱えなくなる
const listFiles = (...globs) =>
  execFileSync(
    "git",
    [
      "ls-files",
      "-z",
      "--cached",
      "--others",
      "--exclude-standard",
      "--",
      ...globs,
    ],
    { cwd: ROOT, encoding: "utf8" },
  )
    .split("\0")
    .filter(Boolean)
    // --cached は作業ツリーで削除済みの追跡ファイルも返す
    .filter((f) => existsSync(abs(f)))
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

// 検査しない範囲を空白で塗る。行番号を保つため改行は残す
const mask = (s) => s.replace(/[^\n]/g, " ");

// GFM のコードフェンス: 行頭 0〜3 空白に ``` か ~~~ を 3 文字以上。
// 閉じは同じ文字で開きと同じ長さ以上（情報文字列なし）。閉じが無ければ末尾まで
const blankFences = (src) => {
  let fence = null;
  return src
    .split("\n")
    .map((line) => {
      if (fence) {
        const close = line.match(/^ {0,3}(`{3,}|~{3,})[ \t]*$/);
        if (
          close &&
          close[1][0] === fence.char &&
          close[1].length >= fence.length
        ) {
          fence = null;
        }
        return mask(line);
      }
      const open = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
      // バッククォートのフェンスの情報文字列にはバッククォートを含められない（含めばコードスパン）
      if (open && !(open[1][0] === "`" && open[2].includes("`"))) {
        fence = { char: open[1][0], length: open[1].length };
        return mask(line);
      }
      return line;
    })
    .join("\n");
};

// インラインコード内の `[text](path)` はリンクではない。
// コードスパンは同じ長さのバッククォート列で閉じ、改行はまたげるが空行（段落の区切り）はまたがない。
// 閉じが無いバッククォートは文字どおりの記号として残す
const runLengthAt = (src, i) => {
  let j = i;
  while (src[j] === "`") j += 1;
  return j - i;
};
const closingRunOf = (src, from, length) => {
  let j = from;
  while (j < src.length) {
    const k = src.indexOf("`", j);
    if (k === -1) return -1;
    const n = runLengthAt(src, k);
    if (n === length) return k;
    j = k + n;
  }
  return -1;
};
const blankInlineCode = (src) => {
  let out = "";
  let i = 0;
  while (i < src.length) {
    if (src[i] !== "`") {
      out += src[i];
      i += 1;
      continue;
    }
    const n = runLengthAt(src, i);
    const close = closingRunOf(src, i + n, n);
    if (close === -1 || /\n[ \t]*\n/.test(src.slice(i + n, close))) {
      out += src.slice(i, i + n);
      i += n;
      continue;
    }
    out += mask(src.slice(i, close + n));
    i = close + n;
  }
  return out;
};
const lineOf = (src, index) => src.slice(0, index).split("\n").length;

// GitHub の見出しアンカー: 小文字化し、文字・数字・結合文字・`_`・空白・`-` 以外を落とし、空白を `-` にする
const slugOf = (heading) =>
  heading
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\p{Pc} -]/gu, "")
    .replace(/ /g, "-");

// 見出し: ATX（行頭 0〜3 空白の `#`）と Setext（次の行が `===` / `---`）。
// Setext の本文になれるのは段落の行だけなので、リスト・引用・表・見出し・空行は除く
const ATX_HEADING = /^ {0,3}#{1,6}(?:[ \t]+(.*?))?[ \t]*$/;
const SETEXT_UNDERLINE = /^ {0,3}(?:=+|-+)[ \t]*$/;
const NOT_PARAGRAPH = /^\s*$|^ {0,3}(?:[-*+>|#]|\d+[.)])/;
const headingsOf = (src) => {
  const lines = src.split("\n");
  const headings = [];
  lines.forEach((line, i) => {
    const atx = line.match(ATX_HEADING);
    if (atx) {
      headings.push((atx[1] ?? "").replace(/[ \t]+#+$/, ""));
    } else if (
      i + 1 < lines.length &&
      SETEXT_UNDERLINE.test(lines[i + 1]) &&
      !NOT_PARAGRAPH.test(line)
    ) {
      headings.push(line);
    }
  });
  return headings;
};

// 見出しの slug は大文字小文字を区別せず、HTML の id / name は書かれたとおりに照合する
const anchorCache = new Map();
const anchorsOf = (file) => {
  if (anchorCache.has(file)) return anchorCache.get(file);
  const fenced = blankFences(readFileSync(abs(file), "utf8"));
  const slugs = new Set();
  const seen = new Map();
  // 見出しの中のインラインコードは見出しの文字として slug に含まれるので、塗る前の本文から取る
  for (const heading of headingsOf(fenced)) {
    const slug = slugOf(heading);
    const n = seen.get(slug) ?? 0;
    seen.set(slug, n + 1);
    slugs.add(n === 0 ? slug : `${slug}-${n}`);
  }
  const ids = new Set(
    [
      ...blankInlineCode(fenced).matchAll(/<a\s+(?:name|id)=["']([^"']+)["']/g),
    ].map((m) => m[1]),
  );
  const anchors = { slugs, ids };
  anchorCache.set(file, anchors);
  return anchors;
};

const hasAnchor = ({ slugs, ids }, anchor) =>
  ids.has(anchor) || slugs.has(anchor.toLowerCase());

const decode = (s) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

// インラインリンクの宛先: `<...>` か、空白を含まず括弧の釣り合いが取れた文字列（`\(` `\)` はエスケープ）
const inlineLinksOf = (src) => {
  const links = [];
  for (const m of src.matchAll(/\]\(/g)) {
    let i = m.index + 2;
    while (src[i] === " " || src[i] === "\t") i += 1;
    let target;
    if (src[i] === "<") {
      const end = src.indexOf(">", i);
      if (end === -1) continue;
      target = src.slice(i + 1, end);
    } else {
      let depth = 0;
      let j = i;
      for (; j < src.length; j += 1) {
        const ch = src[j];
        if (ch === "\\") {
          j += 1;
          continue;
        }
        if (/\s/.test(ch)) break;
        if (ch === "(") depth += 1;
        if (ch === ")") {
          if (depth === 0) break;
          depth -= 1;
        }
      }
      target = src.slice(i, j).replace(/\\([()])/g, "$1");
    }
    if (target) links.push({ target, index: m.index });
  }
  return links;
};
const referenceLinksOf = (src) =>
  [
    ...src.matchAll(
      /^[ \t]*\[[^\]]+\]:[ \t]*<?(\S+?)>?(?:[ \t]+"[^"]*")?[ \t]*$/gm,
    ),
  ].map((m) => ({ target: m[1], index: m.index }));

const broken = [];
const report = (file, src, index, target, reason) =>
  broken.push({ file, line: lineOf(src, index), target, reason });

// ---------- 1. Markdown リンク ----------
const markdownFiles = listFiles("*.md");
for (const file of markdownFiles) {
  const src = blankInlineCode(blankFences(readFileSync(abs(file), "utf8")));
  for (const { target, index } of [
    ...inlineLinksOf(src),
    ...referenceLinksOf(src),
  ]) {
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
      report(file, src, index, target, "ファイルが無い");
      continue;
    }
    if (
      rawAnchor &&
      resolved.endsWith(".md") &&
      statSync(abs(resolved)).isFile() &&
      !hasAnchor(anchorsOf(resolved), decode(rawAnchor))
    ) {
      report(file, src, index, target, "見出しが無い");
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
