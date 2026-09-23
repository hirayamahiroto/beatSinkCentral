# 0004: `packages/ui` はテストが 0 件のあいだ `test` script を持たない

- ステータス: 採用
- 日付: 2026-09-23
- 出所: [#319](https://github.com/hirayamahiroto/beatSinkCentral/pull/319) §5-4（Issue 5、実施は A2-2）

## 決定

`packages/ui` の `test` script はテストが 0 件のあいだ削除し、CI から外す。UI の検証手段は Storybook / Chromatic とし、その旨を `strategy.md` に一行書く。`packages/ui` にテストを書き始めた時点で script を戻す。

## 理由

- 0 件の vitest を CI で走らせても何も担保せず、「テストが走っている」という誤認だけを生む。
- UI コンポーネントの仕様は Storybook が中心（`docs/architecture/frontend/ui/storybook.md`）。

## 却下した案

- script を残して CI で走らせる。空の green は担保の無さを隠す。
- ダミーテストを置く。数値のためのテストであり `strategy.md` §12-5 に反する。

## 影響する規範

- `docs/architecture/testing/strategy.md` §0 テスト分類と優先度
- `docs/architecture/frontend/ui/storybook.md`
