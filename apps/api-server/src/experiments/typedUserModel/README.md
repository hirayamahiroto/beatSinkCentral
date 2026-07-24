# experiments/typedUserModel — 型で表現する関数型DDDの試作

> **⚠️ これは提案・未採用のサンプルです。** production の `src/domain/users` を置き換えるものではありません。
> 既存の設計規範は `docs/server-architecture/architecture.md`。本サンプルはそれと**異なるスタイル**を検討するための隔離コードで、
> route / container / DB には一切接続していません（純粋な型とドメインロジックのみ）。

## なぜこれを作ったか

既存の `domain/users` は「関数型DDD」を掲げているが、正当性の担保を**型ではなく実行時（factory の `throw`）＋「factory 経由でしか作らない」規約**に頼っている。

具体的に、既存では以下が「型で表現されていない」:

| 表現したいこと           | 既存の実態                             | 型で表現できているか |
| ------------------------ | -------------------------------------- | -------------------- |
| Email が正当な形式       | `createEmail` が実行時 `throw`         | ❌                    |
| Email と Sub は別物      | どちらも `{ readonly value: string }`  | ❌（構造的に同一）    |
| 処理が失敗しうる         | `throw`（typed error）                 | ❌（total に見える）  |
| 登録済み / 未登録の状態  | `User \| null` を引数で運ぶ            | △（状態機械ではない） |

`Email` と `Sub` が構造的に同一なため、既存では次が**コンパイルを通ってしまう**:

```ts
const email: Email = createSub("auth0|123"); // ✅ 既存では通る（取り違えを型で防げない）
```

## このサンプルが示す「型で表現する」3点

1. **ブランド型** — `_tag` 判別子で Email と Sub を別の型にする。取り違えは**コンパイルエラー**になる（`valueObjects/*/index.test.ts` の `@ts-expect-error` で検証）。
2. **Result で失敗を型に出す** — `createEmail(v): Result<Email, InvalidEmailFormatError>`。`throw` をやめ、シグネチャを見ただけで「失敗しうる」と分かる。呼び出し側は分岐を強制される。
3. **状態を判別可能ユニオンで表現** — `User = UnregisteredUser | RegisteredUser`。`registered` のみ `id` を型として持ち、「未登録なのに id を読む」は**コンパイルで弾かれる**。

## workflow のつなぎ方（railway）

`workflow/registerUser` は、上記の型を入出力に持つ純粋関数を `flatMap` / `map` で合成する:

```
既存チェック → createSub → createEmail → RegisteredUser 組み立て
   (short-circuit)   (Result)     (Result)
```

失敗は `Result` として運ばれ、`RegisterUserError`（3種のユニオン）に型付けされる。副作用（DB fetch / save）は持たず、`existingUser` と `newId` を**引数で受け取る純粋関数**にしている（既存 `registerNewUser` と同じ思想）。

## ディレクトリ

```
typedUserModel/
├── result/                     Result<T,E> と ok/err/map/flatMap
├── valueObjects/email/         ブランド型 Email + createEmail(Result)
├── valueObjects/sub/           ブランド型 Sub + createSub(Result)
├── user/                       状態の判別可能ユニオン
└── workflow/registerUser/      railway スタイルの workflow
```

## 既存パターンとのトレードオフ

| 観点             | 既存（throw + `{value}`）            | 本サンプル（Result + brand + union） |
| ---------------- | ------------------------------------ | ------------------------------------ |
| 記述量           | 少ない                               | 増える（Result の連結・分岐）        |
| 失敗の可視性     | シグネチャに出ない                   | 型に出る                             |
| 取り違え防止     | 規約頼み                             | コンパイラが強制                     |
| errorMap との接続 | throw を捕捉する既存機構にそのまま乗る | Result → HTTP 変換の設計が別途必要   |

**採用するかは未決。** 全面移行するなら `docs/server-architecture/architecture.md` の規範更新が前提になる。
