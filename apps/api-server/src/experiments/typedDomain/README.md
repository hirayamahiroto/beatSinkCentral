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
├── shared/defineUsecase/   deps の「過剰提供」を型で弾く DI ヘルパ（後述）
├── users/                  Email/Sub(brand) + User状態union + policies + workflow + usecase(repository port + defineUsecase + Result)
├── artists/                accountId/artistId(brand) + Artist + policies + createArtist
├── artistProfiles/         各VO(brand) + Profile状態union(draft/published) + policies + publishProfile
└── linkTypes/              マスタ参照型（code をbrand化）
```

各ドメインは既存 `apps/api-server/src/domain/<name>` の項目・検証ルールを踏襲しつつ、上記スタイルへ置き換えている。

### policy 層の粒度

制約（不変条件）は **ドメインごとに `policies/index.ts` 1ファイル**に名前付き純粋関数として集約し、`Result<void, E>`（または絞り込み後の型）を返す。workflow はそれを `flatMap` で合成する。

- 制約に**名前を付け・単独でテストでき・再利用できる**単位を保つ（＝「どんな制約があるか」の目録）。
- ただし **1ルール＝1ディレクトリには割らない**。policy が helper を持つ・意味ある軸でまとまる段階で初めてディレクトリに分割する（`architecture.md` の「先回りでグルーピングしない」に沿う）。
- `artistProfiles` の `assertProfilePublishable` は判定と同時に `DraftProfile → PublishedProfile` へ絞り込む（parse, don't validate）。

## 既存パターンとのトレードオフ

| 観点              | 既存（throw + `{value}`）              | 本サンプル（Result + brand + union）  |
| ----------------- | -------------------------------------- | ------------------------------------- |
| 記述量            | 少ない                                 | 増える（Result の連結・分岐）         |
| 失敗の可視性      | シグネチャに出ない                     | 型に出る                              |
| 取り違え防止      | 規約頼み                               | コンパイラが強制                      |
| 状態の不整合防止  | 実行時判定                             | コンパイル時に不可能化                |
| errorMap との接続 | throw を捕捉する既存機構にそのまま乗る | Result → HTTP 変換の設計が別途必要    |

## shared/defineUsecase — 依存の「受け渡し」を型で締める

Usecase が本体で使える依存は `Deps` 型が縛る（＝「使用の制御」）が、**呼び出し側が余分に渡すこと（過剰提供）は構造的部分型＋スプレッドで素通り**する。`useCase(input, { ...container })` が通ってしまうのがそれ。

`defineUsecase` はカリー化で deps を composition root に束ね、束ねる箇所で**余剰キーを `never` 制約で弾く**。

```ts
const updateMyEmail = defineUsecase<Deps, Input, Output>((deps) => (input) => ...);
updateMyEmail({ userRepository, txRunner }); // ✅ ちょうど
updateMyEmail({ ...container });             // ❌ コンパイルエラー（余剰キーを弾く／スプレッドでも効く）
```

- `Deps` 型（使用の制御）と `defineUsecase`（受け渡しの制御）は**別々の境界**を締める。
- route は束ねた関数を呼ぶだけになり、deps を渡す責務が消える＝過剰提供が起きえない。
- 効果は `shared/defineUsecase/index.test.ts` の `@ts-expect-error`（過剰・スプレッド・不足の3ケース）で固定。

## usecase 層（縦の完成形）

`users/usecase/registerUser` は、この型スタイルの縦を1本通した例:

- **repository ポート**（`users/repository`）= 純粋なインターフェース。DB を知らない。
- **defineUsecase** で `Deps`（ポート + `newId`）を束ね、過剰提供を型で弾く。
- 中で **workflow（`registerUser`）を呼び、`Result` をそのまま返す**（失敗が usecase シグネチャに出る）。副作用（fetch/save）はポート越し、ID 採番は `newId: () => string` を注入して純粋に保つ。

```
VO(Result) → workflow(Result) → usecase(defineUsecase + port, Result) → [境界で Result を分岐]
```

テストは in-memory の fake ポートで、成功 / 登録済み / 入力不正の3経路を Result で検証する。

**採用可否は未決。** 全面移行するなら `docs/server-architecture/architecture.md` の規範更新が前提。
