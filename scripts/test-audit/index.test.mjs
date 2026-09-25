// scripts/test-audit/index.test.mjs
// 偽パスを数える計測器そのものが偽パスしないよう、違反の形ごとに検出と非検出を確かめる。
// `node --test scripts/test-audit/index.test.mjs`

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), "index.mjs");

const USECASE_TEST = "apps/api-server/src/usecases/example/run/index.test.ts";
const ROUTE_TEST =
  "apps/api-server/src/app/api/[[...route]]/example/get/index.test.ts";

const audit = (files, ...flags) => {
  const root = mkdtempSync(join(tmpdir(), "test-audit-"));
  for (const [path, body] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), body);
  }
  const result = spawnSync(
    process.execPath,
    [SCRIPT, "--root", root, "--json", ...flags],
    { encoding: "utf8" },
  );
  return { summary: JSON.parse(result.stdout), status: result.status };
};

const lines = (...xs) => xs.join("\n") + "\n";

describe("A. 純粋モジュールのモック", () => {
  for (const [name, code] of [
    ["vi.mock", `vi.mock("../../../domain/example");`],
    ["vi.doMock", `vi.doMock("../../../domain/example");`],
    ["vi.mock(import())", `vi.mock(import("../../../domain/example"));`],
    ["@/ エイリアス", `vi.mock("@/usecases/other");`],
    [
      "namespace import への vi.spyOn",
      lines(
        `import * as factories from "../../../domain/example/factories";`,
        `vi.spyOn(factories, "create");`,
      ),
    ],
    [
      "named import への vi.spyOn",
      lines(
        `import { helpers as h } from "../../../domain/example";`,
        `vi.spyOn(h, "calc");`,
      ),
    ],
  ]) {
    test(`${name} を検出し、--strict で exit 1 になる`, () => {
      const { summary, status } = audit({ [USECASE_TEST]: code }, "--strict");

      assert.equal(summary.pureModuleMocks.length, 1);
      assert.equal(status, 1);
    });
  }

  test("殻の差し替え・グローバルへの spyOn・コメント内の記述は検出しない", () => {
    // 合成点の層に置くと殻モックの型付け（B）も判定されるため、A だけを見られる層に置く
    const { summary, status } = audit(
      {
        "apps/api-server/src/utils/example/index.test.ts": lines(
          `// 以前は vi.mock("../../domain/example") していた`,
          `/* vi.doMock("../../usecases/other") */`,
          `vi.mock("../../infrastructure/capabilities");`,
          `vi.spyOn(crypto, "randomUUID");`,
        ),
      },
      "--strict",
    );

    assert.equal(summary.pureModuleMocks.length, 0);
    assert.equal(status, 0);
  });
});

describe("B. 殻モックの型付き率", () => {
  for (const [name, code] of [
    ["型引数なしの vi.fn()", `const repo = { load: vi.fn() };`],
    ["vi.fn<any>()", `const repo = { load: vi.fn<any>() };`],
    [
      "any を含む関数型の vi.fn",
      `const repo = { load: vi.fn<(...args: any[]) => any>() };`,
    ],
  ]) {
    test(`${name} を型なしとして数え、--strict で exit 1 になる`, () => {
      const { summary, status } = audit({ [ROUTE_TEST]: code }, "--strict");

      assert.deepEqual(
        [
          summary.shellMockTyping.route.total,
          summary.shellMockTyping.route.typed,
        ],
        [1, 0],
      );
      assert.equal(status, 1);
    });
  }

  test("契約型で縛った vi.fn は型付きとして数える（=> の > で切れない）", () => {
    const { summary, status } = audit(
      {
        [ROUTE_TEST]: lines(
          `const repo = {`,
          `  load: vi.fn<(id: string) => Promise<Array<string>>>(),`,
          `  save: vi.fn<IWriter["save"]>(),`,
          `} satisfies IWriter;`,
        ),
      },
      "--strict",
    );

    assert.deepEqual(
      [
        summary.shellMockTyping.route.total,
        summary.shellMockTyping.route.typed,
      ],
      [1, 1],
    );
    assert.equal(status, 0);
  });

  test("testDoubles 経由の型なし vi.fn も検出する", () => {
    const { summary } = audit({
      [ROUTE_TEST]: `import { createRepoMock } from "../../../../testDoubles";\n`,
      "apps/api-server/src/app/testDoubles/index.ts": `export const createRepoMock = () => ({ load: vi.fn() });\n`,
    });

    const route = summary.shellMockTyping.route;
    assert.deepEqual([route.total, route.typed], [1, 0]);
    assert.deepEqual(route.untypedFiles[0].viaHelper, [
      "apps/api-server/src/app/testDoubles/index.ts",
    ]);
  });

  test("文字列・テンプレート・正規表現の中の // より後ろも検査する", () => {
    const { summary, status } = audit(
      {
        [ROUTE_TEST]: lines(
          `const url = "https://example.com"; const a = { load: vi.fn<any>() };`,
          "const path = `//cdn`; const b = { load: vi.fn<any>() };",
          String.raw`const re = /https?:\/\//; const c = { load: vi.fn<any>() };`,
          `const cls = /[/]/; const d = { load: vi.fn<any>() };`,
        ),
      },
      "--strict",
    );

    assert.deepEqual(summary.shellMockTyping.route.untypedFiles[0].untyped, 4);
    assert.equal(status, 1);
  });
});

describe("C. フィクスチャの factory 導出率", () => {
  test("factory・封筒・手書きリテラルを分けて数える", () => {
    const { summary } = audit({
      [ROUTE_TEST]: lines(
        `repo.load.mockResolvedValue(reconstructProfile({ id: "p1" }));`,
        `resolve.mockResolvedValue({ status: "complete", actor });`,
        `resolve.mockResolvedValue({ status: "complete", actor: { user, artist } });`,
        `fetch.mockResolvedValueOnce({ ok: true, value: undefined });`,
        `repo.load.mockResolvedValue({ kind: "noProfile", artistId: "a1" });`,
        `repo.load.mockResolvedValue({ id: "p1", name: "Taro" });`,
      ),
    });

    assert.deepEqual(
      {
        fromFactory: summary.fixtureDerivation.fromFactory,
        envelope: summary.fixtureDerivation.envelope,
        literal: summary.fixtureDerivation.literal,
      },
      { fromFactory: 1, envelope: 3, literal: 2 },
    );
  });
});
