// apps/api-server/stryker.config.mjs
// 検知力そのものを測る: 実装を機械的に壊して、テストが落ちる割合（mutation score）を出す。
// npm run test:mutation              … 全量（nightly 向け）
// npm run test:mutation:domain       … domain に絞る（--mutate は除外パターンごと置き換わるので除外も一緒に渡す）
// npm run test:mutation:incremental  … 変更分だけ（PR 向け）

/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
  testRunner: "vitest",
  vitest: { configFile: "vitest.config.mts" },
  coverageAnalysis: "perTest",
  incrementalFile: ".stryker-tmp/incremental.json",
  reporters: ["clear-text", "html", "json"],
  htmlReporter: { fileName: "reports/mutation/index.html" },
  jsonReporter: { fileName: "reports/mutation/report.json" },

  // 層ごとに別の基準を持つ（strategy.md §6: 数値は診断用、合格ラインは層の責務で決める）
  // domain: 仕様の原本。高く。 usecase / route: 合成の責務だけ見るので domain より低くて正常。
  mutate: [
    "src/domain/**/*.ts",
    "src/usecases/**/*.ts",
    "src/app/api/**/*.ts",
    "!src/**/*.test.ts",
    "!src/**/testDoubles/**",
    "!src/**/entities/index.ts", // 型のみ
    "!src/**/repositories/index.ts", // インターフェースのみ
    "!src/infrastructure/**", // 殻は統合テストの責務（Phase 2）
  ],

  // 「壊しても落ちない」が設計上の正解になる箇所は除外して、survived の中身を読める量に保つ
  mutator: {
    excludedMutations: ["StringLiteral", "ObjectLiteral"], // エラーメッセージ文言・ログ文言は仕様ではない（§8）
  },

  thresholds: { high: 90, low: 70, break: null }, // break は CI ゲートにしない。推移を見る
  timeoutMS: 20000,
  concurrency: 4,
};

export default config;
