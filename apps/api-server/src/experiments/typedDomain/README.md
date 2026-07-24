# experiments/typedDomain — 型で表現する関数型DDDの試作

> **⚠️ これは提案・未採用のサンプルです。** production の `src/domain/*` を置き換えるものではありません。
> 既存の設計規範は `docs/server-architecture/architecture.md`。本サンプルはそれと**異なるスタイル**を検討するための隔離コードで、
> route / container / DB には一切接続していません（純粋な型とドメインロジックのみ）。
>
> 提案の全文・論点・意思決定事項は `docs/discussions/typed-functional-ddd-user-model.md` を参照。

## ねらい

既存 `domain/*` は「関数型DDD」を掲げているが、正当性の担保を**型ではなく実行時（factory の `throw`）＋「factory 経由でしか作らない」規約**に頼っている（例: `Email` と `Sub` が構造的に同一で取り違えを型で防げない、失敗がシグネチャに出ない）。

このサンドボックスは、既存の各ドメインを**型で表現し直す**とどうなるかを、同じ3つの型テクニックで揃えて示す。

1. **ブランド型** — `_tag` 判別子で VO どうしの取り違えをコンパイルエラーにする。
2. **Result で失敗を型に出す** — `create*` は `throw` せず `Result<T, E>` を返す。
3. **状態を判別可能ユニオンで表現** — 「その状態では存在しないフィールド」を型で不可能にする。

workflow は上記の型を `flatMap` / `map` で合成する railway スタイルの純粋関数（副作用なし）。
`@ts-expect-error` により、意図したコンパイルエラーが実際に成立することをテストで固定している（vitest は型を見ないため `tsc` 必須）。

## 構成

```
typedDomain/
├── shared/result/          Result<T,E> と ok/err/map/flatMap（全ドメイン共有）
├── users/                  Email/Sub(brand) + User状態union + registerUser workflow
├── artists/                accountId/artistId(brand) + Artist + workflow
├── artistProfiles/         profileName/tagline/story/... (brand) + Profile状態union(draft/published)
└── linkTypes/              マスタ参照型（code/label/icon）
```

各ドメインは既存 `apps/api-server/src/domain/<name>` の項目・検証ルールを踏襲しつつ、上記スタイルへ置き換えている。

## 既存パターンとのトレードオフ

| 観点              | 既存（throw + `{value}`）              | 本サンプル（Result + brand + union）  |
| ----------------- | -------------------------------------- | ------------------------------------- |
| 記述量            | 少ない                                 | 増える（Result の連結・分岐）         |
| 失敗の可視性      | シグネチャに出ない                     | 型に出る                              |
| 取り違え防止      | 規約頼み                               | コンパイラが強制                      |
| 状態の不整合防止  | 実行時判定                             | コンパイル時に不可能化                |
| errorMap との接続 | throw を捕捉する既存機構にそのまま乗る | Result → HTTP 変換の設計が別途必要    |

**採用可否は未決。** 全面移行するなら `docs/server-architecture/architecture.md` の規範更新が前提。
