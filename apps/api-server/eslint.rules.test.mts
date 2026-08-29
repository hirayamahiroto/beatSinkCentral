import { join } from "node:path";
import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

// vitest の root は apps/api-server（vitest.config.mts の位置）。
// ここを cwd にすると api-server の eslint.config.mjs がそのまま解決される。
const cwd = process.cwd();

// lintText はファイルを読まず、filePath を設定解決にだけ使う。
// 実ファイルを置かずに「usecases 配下として lint したらどうなるか」を確かめられる。
const ruleIdsFor = async (filePath: string, code: string) => {
  const eslint = new ESLint({ cwd });
  const [result] = await eslint.lintText(code, {
    filePath: join(cwd, filePath),
  });
  return result.messages.map((message) => message.ruleId);
};

const USECASE = "src/usecases/artistProfiles/example/index.ts";
const AUTHORIZATION = "src/usecases/authorization/example/index.ts";
const USECASE_TEST = "src/usecases/artistProfiles/example/index.test.ts";

const BOUNDARY = "local/usecase-capability-boundary";
const PARAMETER = "local/usecase-capability-parameter";

describe("local/usecase-capability-boundary", () => {
  it("infrastructure 層への import を検出する", async () => {
    const ruleIds = await ruleIdsFor(
      USECASE,
      `import { getCapabilityDeps } from "../../../infrastructure/capabilities";\n`,
    );

    expect(ruleIds).toContain(BOUNDARY);
  });

  it("DB クライアントへの import を検出する", async () => {
    const ruleIds = await ruleIdsFor(
      USECASE,
      `import { eq } from "drizzle-orm";\nimport { artist } from "database";\n`,
    );

    expect(ruleIds.filter((ruleId) => ruleId === BOUNDARY)).toHaveLength(2);
  });

  it("動的 import も検出する", async () => {
    const ruleIds = await ruleIdsFor(
      USECASE,
      `export const load = async () => import("../../../infrastructure/capabilities");\n`,
    );

    expect(ruleIds).toContain(BOUNDARY);
  });

  it("テストにも効く", async () => {
    const ruleIds = await ruleIdsFor(
      USECASE_TEST,
      `import { getCapabilityDeps } from "../../../infrastructure/capabilities";\n`,
    );

    expect(ruleIds).toContain(BOUNDARY);
  });

  it("経路モジュール（authorization）にも効く", async () => {
    const ruleIds = await ruleIdsFor(
      AUTHORIZATION,
      `import { getCapabilityDeps } from "../../../infrastructure/capabilities";\n`,
    );

    expect(ruleIds).toContain(BOUNDARY);
  });

  it("domain / capabilities への import は許可する", async () => {
    const ruleIds = await ruleIdsFor(
      USECASE,
      [
        `import type { ArtistProfileView } from "../../../domain/artistProfiles/entities";`,
        `import type { ArtistWriteCapabilities } from "../../capabilities";`,
        `export const getIt = async (caps: ArtistWriteCapabilities) => caps.actor;`,
        ``,
      ].join("\n"),
    );

    expect(ruleIds).not.toContain(BOUNDARY);
  });
});

describe("local/usecase-capability-parameter", () => {
  it("第1引数が権能型でないエクスポート関数を検出する", async () => {
    const ruleIds = await ruleIdsFor(
      USECASE,
      `export const run = async (artistId: string) => artistId;\n`,
    );

    expect(ruleIds).toContain(PARAMETER);
  });

  it("引数を取らないエクスポート関数を検出する", async () => {
    const ruleIds = await ruleIdsFor(
      USECASE,
      `export const run = async () => "done";\n`,
    );

    expect(ruleIds).toContain(PARAMETER);
  });

  it("default export も検出する", async () => {
    const ruleIds = await ruleIdsFor(
      USECASE,
      `export default async function run(artistId: string) {\n  return artistId;\n}\n`,
    );

    expect(ruleIds).toContain(PARAMETER);
  });

  it("Pick した権能型を第1引数に取る形は許可する", async () => {
    const ruleIds = await ruleIdsFor(
      USECASE,
      [
        `import type { ArtistWriteCapabilities } from "../../capabilities";`,
        `type ExampleCaps = Pick<ArtistWriteCapabilities, "actor">;`,
        `export const run = async (caps: ExampleCaps) => caps.actor;`,
        `export const runInline = async (`,
        `  caps: Pick<ArtistWriteCapabilities, "actor">,`,
        `) => caps.actor;`,
        ``,
      ].join("\n"),
    );

    expect(ruleIds).not.toContain(PARAMETER);
  });

  it("関数以外のエクスポートは対象外", async () => {
    const ruleIds = await ruleIdsFor(
      USECASE,
      `export const MAX_PROFILES = 100;\nexport type Input = { id: string };\n`,
    );

    expect(ruleIds).not.toContain(PARAMETER);
  });

  it("テストには適用しない", async () => {
    const ruleIds = await ruleIdsFor(
      USECASE_TEST,
      `export const buildCaps = () => ({ actor: null });\n`,
    );

    expect(ruleIds).not.toContain(PARAMETER);
  });

  it("権能を組み立てる側（authorization）には適用しない", async () => {
    const ruleIds = await ruleIdsFor(
      AUTHORIZATION,
      [
        `import type { CapabilityDeps } from "../../capabilities";`,
        `export const withExample = async (deps: CapabilityDeps) => deps;`,
        ``,
      ].join("\n"),
    );

    expect(ruleIds).not.toContain(PARAMETER);
  });
});
