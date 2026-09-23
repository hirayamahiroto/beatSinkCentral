# 0006: `guidelines.md` / `test-cases.md` は作らない

- ステータス: 採用
- 日付: 2026-09-23
- 出所: [#319](https://github.com/hirayamahiroto/beatSinkCentral/pull/319) §5-6（Issue 8）、[#320](https://github.com/hirayamahiroto/beatSinkCentral/pull/320)

## 決定

テストの `guidelines.md` / `test-cases.md` / `OVERVIEW.md` は作らず、「想定アーティファクト」からも落とす。その役割は `strategy.md` §12（アンチパターン）と `code-review-checklist.md` §15 が持つ。

## 理由

正本の一意性。同じ観点を複数のドキュメントに置くと乖離し、どちらが規範か分からなくなる。既に §12 と §15 が内容を吸収している。

## 却下した案

- 参照先として存在していたので作る。参照が先にあっただけで、独立した役割が無い。

## 影響する規範

- `docs/architecture/testing/strategy.md`
- `docs/README.md`
