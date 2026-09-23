# 0003: Repository のビルダ spy テストは Integration 整備後にまとめて撤去する

- ステータス: 採用
- 日付: 2026-09-23
- 出所: [#319](https://github.com/hirayamahiroto/beatSinkCentral/pull/319) §5-3（Issue 3、実施は C2-1）

## 決定

Repository テストのビルダ spy（`toHaveBeenCalledTimes` / `mockResolvedValueOnce` 連鎖）の撤去は、Integration Test（Issue 4 / C1-1）が整った後に C2-1 で一括して行う。Issue 4 の前に部分着手しない。

## 理由

- 実 DB 統合が無い現状では、spy テストが唯一の Repository 検証。先に消すと安全網が薄くなる。
- 回数検証だけを先に消しても得るものが小さく、Integration で担保されたケースと合わせて撤去した方が差分が読みやすい。

## 却下した案

- 回数検証だけ先行して消す。安全網を薄くする割に効果が小さい。

## 影響する規範

- `docs/architecture/testing/strategy.md` §12-7 Repository をモックだけで済ませ続ける
