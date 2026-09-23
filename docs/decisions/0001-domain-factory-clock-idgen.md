# 0001: domain factory に `clock` / `idGen` を注入しない

- ステータス: 採用
- 日付: 2026-09-23
- 出所: [#319](https://github.com/hirayamahiroto/beatSinkCentral/pull/319) §5-1（Issue 6）、[#325](https://github.com/hirayamahiroto/beatSinkCentral/pull/325)、[#324](https://github.com/hirayamahiroto/beatSinkCentral/pull/324)

## 決定

capabilities に `clock` / `idGen` を持たせない。ID は Entity factory が `crypto.randomUUID()` で採番し、テストで固定したい場合はスタブする。時刻は factory 内で `new Date()` を取らず、殻（usecase / route）で取得して引数で渡す。

## 理由

- `architecture.md` の純粋 Domain の節が、ID は Entity の同一性そのもので、外部から渡すと呼び出し側が採番責務を負うため生成器を注入しない、と明示している。testing 側の docs がこれと食い違っていたため、規範側にそろえた（#325）。
- 時刻は業務上の入力（発生時刻）であり、factory が内部で取ると同じ入力から異なる結果が生まれ、「I/O を持たない」という純粋性の隔離基準を破る。殻で取って渡せば factory は純粋のまま（#324）。

## 却下した案

- capabilities に `clock` / `idGen` を注入する。route mock 18 ファイルの型に影響し、採番責務が呼び出し側へ移る。決定性はスタブで得られるので注入の必要が無い。

## 影響する規範

- `docs/architecture/server/architecture.md` — 純粋 Domain（ID 採番を factory に閉じる）
- `docs/architecture/testing/strategy.md` §9 時間・乱数・環境変数
