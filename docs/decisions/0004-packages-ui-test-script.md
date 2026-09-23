# 0004: `packages/ui` はテストが 0 件のあいだ `test` script を持たない

- ステータス: 採用
- 日付: 2026-09-23
- 出所: [#319](https://github.com/hirayamahiroto/beatSinkCentral/pull/319) §5-4（Issue 5、実施は A2-2）

## 背景

CI の穴を埋める Issue 5 で、`packages/ui` に `test` script（vitest）はあるがテストファイルが 0 件であることが分かった。CI に全 workspace の `test` を載せる（T1）と、この script が「何も検証しない green」を出す。

## 決定

`packages/ui` の `test` script はテストが 0 件のあいだ削除し、CI から外す。UI の検証手段は Storybook / Chromatic とし、その旨を `strategy.md` に一行書く。

## 理由

- 0 件の vitest を走らせても何も担保せず、「テストが走っている」という誤認だけを生む。
- UI コンポーネントの仕様は Storybook が中心（`docs/architecture/frontend/ui/storybook.md`）。検証手段はそちらにある。

## 却下した案

- script を残して CI で走らせる。空の green は担保の無さを隠す。
- ダミーテストを置く。数値のためのテストであり `strategy.md` §12-5 に反する。

## 結果

- `packages/ui` の振る舞い検証は Storybook / Chromatic に依存する。Chromatic の paths 設定が正しいことが前提になる（T1 で直す）。
- 再検討条件: `packages/ui` にテストを書き始めた時点で script を戻し、CI に載せる。

## 影響する規範

- `docs/architecture/testing/strategy.md` §0 テスト分類と優先度
- `docs/architecture/frontend/ui/storybook.md`
