# 0006: `guidelines.md` / `test-cases.md` は作らない

- ステータス: 採用
- 日付: 2026-09-23
- 出所: [#319](https://github.com/hirayamahiroto/beatSinkCentral/pull/319) §5-6（Issue 8）、[#320](https://github.com/hirayamahiroto/beatSinkCentral/pull/320)

## 背景

テスト docs の参照切れ是正（Issue 8）で、`docs/testing/guidelines.md`、`docs/templates/test-cases.md`、`OVERVIEW.md` が「想定アーティファクト」として参照されているが実体が無いことが分かった。作るか、参照を落とすかが論点だった。

## 決定

`guidelines.md` / `test-cases.md` / `OVERVIEW.md` は作らず、参照と「想定アーティファクト」の記述を落とす。その役割は `strategy.md` §12（アンチパターン）と `code-review-checklist` §15 が持つ。

## 理由

- 正本の一意性。同じ観点を複数のドキュメントに置くと乖離し、どちらが規範か分からなくなる。
- 既に §12 と §15 が内容を吸収しており、独立した役割が残っていない。

## 却下した案

- 参照先として存在していたので作る。参照が先にあっただけで、書くべき固有の内容が無い。

## 結果

- テストの規範は `strategy.md` 1 枚と checklist §15 に集約される（#320 で参照切れを是正）。
- テストケースの書き方を個別に示したくなった場合は、新ドキュメントではなく `strategy.md` §10 / §12 に足す。

## 影響する規範

- `docs/architecture/testing/strategy.md`
- `docs/README.md`
