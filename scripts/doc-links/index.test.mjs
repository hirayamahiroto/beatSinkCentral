// scripts/doc-links/index.test.mjs
// 参照切れの形ごとに、検出するものと検出しないものを確かめる。
// `node --test scripts/doc-links/index.test.mjs`

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), "index.mjs");

// 対象は git 管理下のファイルなので、フィクスチャは一時リポジトリに置いて add する
const write = (root, files) => {
  for (const [path, body] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), body);
  }
};
const check = (files, untracked = {}) => {
  const root = mkdtempSync(join(tmpdir(), "doc-links-"));
  write(root, files);
  execFileSync("git", ["init", "-q"], { cwd: root });
  execFileSync("git", ["add", "-A"], { cwd: root });
  write(root, untracked);
  const result = spawnSync(
    process.execPath,
    [SCRIPT, "--root", root, "--json"],
    { encoding: "utf8" },
  );
  const { broken } = JSON.parse(result.stdout);
  return {
    targets: broken.map((b) => `${b.file}:${b.line} ${b.target}`),
    status: result.status,
  };
};

const lines = (...xs) => xs.join("\n") + "\n";

const TARGET = lines(
  "# ガイド",
  "",
  "## 認可と権能（capabilities）",
  "",
  "## 作業の入り口 — どの Skill に乗るか",
  "",
  "## 概要",
  "",
  "## 概要",
  "",
  '<a id="custom-anchor"></a>',
);

describe("Markdown リンク", () => {
  test("存在しないファイルへのリンクを行番号つきで検出し、exit 1 になる", () => {
    const { targets, status } = check({
      "docs/a.md": lines("# A", "", "[壊れ](./missing.md)"),
    });

    assert.deepEqual(targets, ["docs/a.md:3 ./missing.md"]);
    assert.equal(status, 1);
  });

  test("GitHub と同じ規則の見出しアンカーは通し、存在しない見出しは検出する", () => {
    const { targets } = check({
      "docs/guide.md": TARGET,
      "docs/a.md": lines(
        "[全角括弧を落とす](./guide.md#認可と権能capabilities)",
        "[ダッシュを落とし空白を残す](./guide.md#作業の入り口--どの-skill-に乗るか)",
        "[重複見出しは -1](./guide.md#概要-1)",
        "[HTML のアンカー](./guide.md#custom-anchor)",
        "[同じファイル内](#a-の見出し)",
        "",
        "## A の見出し",
        "",
        "[無い見出し](./guide.md#存在しない)",
      ),
    });

    assert.deepEqual(targets, ["docs/a.md:9 ./guide.md#存在しない"]);
  });

  test("ルート起点の / パス・ディレクトリ・参照形式のリンクを解決する", () => {
    const { targets } = check({
      "docs/guide.md": TARGET,
      "docs/sub/a.md": lines(
        "[ルート起点](/docs/guide.md)",
        "[ディレクトリ](../)",
        "[参照形式][ref]",
        "",
        "[ref]: ../missing.md",
      ),
    });

    assert.deepEqual(targets, ["docs/sub/a.md:5 ../missing.md"]);
  });

  test("外部 URL・コードフェンス内のリンクは検査しない", () => {
    const { targets, status } = check({
      "docs/a.md": lines(
        "[外部](https://example.com/missing.md)",
        "[メール](mailto:a@example.com)",
        "```md",
        "[フェンス内](./missing.md)",
        "```",
      ),
    });

    assert.deepEqual(targets, []);
    assert.equal(status, 0);
  });

  test("インラインコード内の [text](path) はリンクとして扱わない", () => {
    const { targets } = check({
      "docs/a.md": lines(
        "書式は `[text](path#anchor)` と `` [x](y) `` の形",
        "[`旧パス`](./missing.md)",
      ),
    });

    assert.deepEqual(targets, ["docs/a.md:2 ./missing.md"]);
  });

  test("git add 前の新規ファイルも検査し、gitignore 済みのファイルは検査しない", () => {
    const { targets } = check(
      { ".gitignore": "reports/\n" },
      {
        "docs/new.md": lines("[壊れ](./missing.md)"),
        "reports/out.md": lines("[壊れ](./missing.md)"),
      },
    );

    assert.deepEqual(targets, ["docs/new.md:1 ./missing.md"]);
  });

  test("日本語のファイル名の Markdown も検査する", () => {
    const { targets } = check({
      "docs/日本語.md": lines("[壊れ](./missing.md)"),
      "docs/a.md": lines("[日本語のファイルへ](./日本語.md)"),
    });

    assert.deepEqual(targets, ["docs/日本語.md:1 ./missing.md"]);
  });

  test("フェンスは同じ文字・開き以上の長さで閉じ、インデントと閉じ忘れも扱う", () => {
    const { targets } = check({
      "docs/a.md": lines(
        "````md",
        "```",
        "[4 文字フェンスの中](./missing-1.md)",
        "```",
        "````",
        "   ~~~",
        "[インデントしたフェンスの中](./missing-2.md)",
        "   ~~~",
        "[フェンスの外](./missing-3.md)",
        "```",
        "[閉じていないフェンスの中](./missing-4.md)",
      ),
    });

    assert.deepEqual(targets, ["docs/a.md:9 ./missing-3.md"]);
  });

  test("複数行のコードスパンの中は検査せず、閉じないバッククォートは段落を越えて塗らない", () => {
    const { targets } = check({
      "docs/a.md": lines(
        "`",
        "[コードスパンの中](./missing-1.md)",
        "`",
        "",
        "閉じない ` バッククォート",
        "",
        "[段落の外](./missing-2.md)",
      ),
    });

    assert.deepEqual(targets, ["docs/a.md:7 ./missing-2.md"]);
  });

  test("括弧を含む宛先を最後まで読む", () => {
    const { targets } = check({
      "docs/guide(v2).md": TARGET,
      "docs/a.md": lines(
        "[在る](./guide(v2).md)",
        "[エスケープ](./guide\\(v2\\).md)",
        "[無い](./missing(v2).md)",
      ),
    });

    assert.deepEqual(targets, ["docs/a.md:3 ./missing(v2).md"]);
  });

  test("Setext とインデントした ATX の見出し、大文字を含む HTML の id を解決する", () => {
    const { targets } = check({
      "docs/guide.md": lines(
        "Setext の見出し",
        "===============",
        "",
        "   ## インデントした見出し",
        "",
        "- リスト",
        "---",
        "",
        '<a id="CamelCase"></a>',
      ),
      "docs/a.md": lines(
        "[Setext](./guide.md#setext-の見出し)",
        "[インデント](./guide.md#インデントした見出し)",
        "[HTML の id](./guide.md#CamelCase)",
        "[リストは見出しでない](./guide.md#リスト)",
      ),
    });

    assert.deepEqual(targets, ["docs/a.md:4 ./guide.md#リスト"]);
  });

  test("規範でない場所（docs/plans 等）でも Markdown リンクは検査する", () => {
    const { targets } = check({
      "docs/plans/p.md": lines("[壊れ](../missing.md)"),
    });

    assert.deepEqual(targets, ["docs/plans/p.md:1 ../missing.md"]);
  });
});

describe("バッククォートのパス", () => {
  test("規範のドキュメントにある存在しないパスを検出する", () => {
    const { targets } = check({
      "docs/guide.md": TARGET,
      "CLAUDE.md": lines(
        "| 認可 | `docs/guide.md#認可と権能capabilities` |",
        "| 旧パス | `docs/server-architecture/design.md` |",
        "| script | `scripts/missing/index.mjs` |",
      ),
    });

    assert.deepEqual(targets, [
      "CLAUDE.md:2 docs/server-architecture/design.md",
      "CLAUDE.md:3 scripts/missing/index.mjs",
    ]);
  });

  test("書式の例示・glob・gitignore 済みのパス・規範でない場所は検査しない", () => {
    const { targets, status } = check({
      ".gitignore": ".claude/worktrees/\n",
      "CLAUDE.md": lines(
        "`docs/...` `docs/…` `docs/**/*.md` `docs/<name>.md` `.claude/worktrees/x`",
      ),
      "docs/adr/0001.md": lines("廃止した `docs/testing/guidelines.md`"),
      "docs/plans/p.md": lines("`docs/frontend-architecture/`"),
      "docs/discussions/d.md": lines("案: `docs/architecture/lifecycle.md`"),
    });

    assert.deepEqual(targets, []);
    assert.equal(status, 0);
  });
});

describe("コード中のドキュメント参照", () => {
  test("コメント・文字列の docs/ と .claude/ のパスを検査する", () => {
    const { targets } = check({
      "docs/guide.md": TARGET,
      "apps/x/index.ts": lines(
        "// docs/guide.md を参照",
        '// 規範は "docs/architecture/missing.md"',
        "export const x = 1;",
      ),
      ".github/workflows/ci.yml": lines(
        "# 読み方は .claude/skills/missing/SKILL.md",
      ),
    });

    assert.deepEqual(targets, [
      ".github/workflows/ci.yml:1 .claude/skills/missing/SKILL.md",
      "apps/x/index.ts:2 docs/architecture/missing.md",
    ]);
  });
});
