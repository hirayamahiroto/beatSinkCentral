# 設計判断の記録（ADR）

**なぜそう決めたか**を残す場所。規範ではない。規範は `product/` と `architecture/` が持ち、ここには規範がその形になった理由・却下した案・影響範囲を置く。

## 位置づけ

| ディレクトリ    | 持つもの                       |
| --------------- | ------------------------------ |
| `discussions/`  | 未合意の検討・調査・提案       |
| `adr/`    | 合意した判断とその理由（本書） |
| `architecture/` | 判断の結果としての規範         |
| `plans/`        | 着手順・依存・PR 分割          |

流れは **discussions で検討 → 合意時に ADR を 1 枚切る → 規範（architecture / product）を更新 → plans / Issue は ADR を参照する**。`plans/` は時限で完了後は参照されないため、決定の本文を `plans/` や Issue に書かない。リンクだけ置く。

## 形式

1 決定 1 ファイル。ファイル名は `NNNN-<slug>.md`（連番）。置換されても削除せず、ステータスを「置換」にして後継を指す。

節は Nygard 形式（Context / Decision / Consequences）に「却下した案」と「影響する規範」を足したもの。

```markdown
# NNNN: <決定を 1 文で>

- ステータス: 提案 | 採用 | 置換（→ NNNN）
- 日付: YYYY-MM-DD
- 出所: <Issue / PR / discussion へのリンク>

## 背景

<何が問題で判断が必要になったか。判断の前提となる事実>

## 決定

<何をどうするか>

## 理由

<その決定を選んだ判断軸>

## 却下した案

<検討した他の案と、捨てた理由>

## 結果

<決定で得たもの・失うもの・副作用。再検討する条件>

## 影響する規範

<規範ドキュメントの該当節へのリンク。規範に ID が振られたらそれを指す>
```

ステータス「提案」は、skill の「止まるべき地点」で停止したときに AI が下書きとして置く。人が採否を決めて「採用」にする。

## 索引

| ID                                                             | 決定                                                                   | ステータス | 出所 |
| -------------------------------------------------------------- | ---------------------------------------------------------------------- | ---------- | ---- |
| [0001](./0001-domain-factory-clock-idgen.md)                    | domain factory に `clock` / `idGen` を注入しない                        | 採用       | #319 §5-1 / #325 / #324 |
| [0002](./0002-integration-test-db-postgres-service-container.md) | Integration Test の DB は Postgres service container で起動する         | 採用       | #319 §5-2 |
| [0003](./0003-repository-mock-removal-after-integration.md)     | Repository のビルダ spy テストは Integration 整備後にまとめて撤去する   | 採用       | #319 §5-3 |
| [0004](./0004-packages-ui-test-script.md)                       | `packages/ui` はテストが 0 件のあいだ `test` script を持たない          | 採用       | #319 §5-4 |
| [0005](./0005-thin-shells-without-tests.md)                     | 振る舞いの無い薄い殻にはテストを書かない                               | 採用       | #319 §5-5 / #328 |
| [0006](./0006-no-guidelines-and-test-cases-docs.md)             | `guidelines.md` / `test-cases.md` は作らない                           | 採用       | #319 §5-6 / #320 |
| [0007](./0007-client-adapter-passes-hook-functions.md)          | ClientAdapter は hook の関数をラップせず渡す                           | 提案       | #330 |
