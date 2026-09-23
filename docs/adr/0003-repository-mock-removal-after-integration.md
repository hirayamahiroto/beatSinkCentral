# 0003: Repository のビルダ spy テストは Integration 整備後にまとめて撤去する

- ステータス: 採用
- 日付: 2026-09-23
- 出所: [#319](https://github.com/hirayamahiroto/beatSinkCentral/pull/319) §5-3（Issue 3、実施は C2-1）

## 背景

Repository テスト 9 件・計 36 箇所がクエリビルダの spy（`toHaveBeenCalledTimes` / `mockResolvedValueOnce` 連鎖）で内部実装を検証しており、`strategy.md` §12-7 のアンチパターンに当たる（Issue 3）。一方で実 DB の Integration Test（Issue 4）は未整備で、この spy テストが唯一の Repository 検証になっている。Issue 3 を Issue 4 の前に部分着手するかが論点だった。

## 決定

ビルダ spy の撤去は Integration Test（C1-1）が整った後に C2-1 で一括して行う。Issue 4 の前に部分着手しない。

## 理由

- 実 DB 統合が無い現状では spy テストが唯一の安全網。先に消すと Repository が無検証になる期間ができる。
- 回数検証だけを先に消しても得るものが小さい。Integration で担保されたケースと合わせて撤去した方が差分が読みやすい。

## 却下した案

- 回数検証（`toHaveBeenCalledTimes`）だけ先行して消す。安全網を薄くする割に効果が小さい。

## 結果

- Issue 4 完了まで §12-7 違反が残る。その間に Repository へ変更が入ると、spy テストの追従コストを払う。
- C2-1 では行 → 集約の写像を純粋関数に切り出して単体テストを付け、Integration で担保されたケースの mock テストを削る。

## 影響する規範

- `docs/architecture/testing/strategy.md` §12-7 Repository をモックだけで済ませ続ける
