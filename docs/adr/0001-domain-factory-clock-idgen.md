# 0001: domain factory に `clock` / `idGen` を注入しない

- ステータス: 採用
- 日付: 2026-09-23
- 出所: [#319](https://github.com/hirayamahiroto/beatSinkCentral/pull/319) §5-1（Issue 6）、[#325](https://github.com/hirayamahiroto/beatSinkCentral/pull/325)、[#324](https://github.com/hirayamahiroto/beatSinkCentral/pull/324)

## 背景

テスト戦略準拠監査（Issue 6）で、domain factory 9 箇所が `crypto.randomUUID()` と `new Date()` を内部で呼んでいることが挙がった。`strategy.md` / `background.md` は「時間・乱数は注入する」と読める記述で、`architecture.md` は「ID 採番は factory に閉じる」と明示しており、規範同士が食い違っていた。Issue 1（route mock を `satisfies` で縛る）の前に capabilities の型を確定させる必要があった。

## 決定

capabilities に `clock` / `idGen` を持たせない。ID は Entity factory が `crypto.randomUUID()` で採番し、テストで固定したい場合はスタブする。時刻は factory 内で `new Date()` を取らず、殻（usecase / route）で取得して引数で渡す。testing 側の docs は `architecture.md` の立場にそろえる。

## 理由

- ID は Entity の同一性そのもの。外部から渡すと呼び出し側が採番責務を負う。この理由を `architecture.md` が既に述べており、規範を変える根拠が無い。
- 時刻は業務上の入力（発生時刻）。factory が内部で取ると同じ入力から異なる結果が生まれ、「I/O を持たない」という純粋性の隔離基準を破る。殻で取って渡せば factory は純粋のまま。
- 決定性はスタブで得られる。注入しなくてもテストは書ける。

## 却下した案

- capabilities に `clock` / `idGen` を注入する。route mock 18 ファイルの型に影響し、採番責務が呼び出し側へ移る。得られるのはスタブでも得られる決定性だけ。

## 結果

- 実装は `analyticsEvents` factory の `new Date()` 1 箇所のみ（`occurredAt` を usecase から渡す、#324）。factory 7 箇所の `crypto.randomUUID()` は規範適合として現状維持。
- capabilities の型が変わらないため、Issue 1 の route mock 移行を先行できる。
- ID を固定したいテストは `crypto.randomUUID` をスタブする手間を負う。

## 影響する規範

- `docs/architecture/server/architecture.md` — 純粋 Domain（ID 採番を factory に閉じる）
- `docs/architecture/testing/strategy.md` §9 時間・乱数・環境変数
