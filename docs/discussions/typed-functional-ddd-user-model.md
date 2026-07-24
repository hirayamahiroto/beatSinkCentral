# 提案: 型で表現する関数型DDD（ユーザードメインでの試作）

| 項目       | 内容                                                                      |
| ---------- | ------------------------------------------------------------------------- |
| ステータス | **検討中 / 未合意**（たたき台）                                           |
| 起票日     | 2026-07-25                                                                |
| 対象       | `apps/api-server` ドメイン層のモデリングスタイル                          |
| 関連       | draft PR #184、サンプル `apps/api-server/src/experiments/typedUserModel/` |
| 現行規範   | `docs/server-architecture/architecture.md`（本提案はこれと異なる案）      |

> `docs/discussions/` は「未合意の検討」を置く場所であり、規範ではない。合意できたら規範（`architecture`）へ昇格し、本ファイルは役目を終える。

---

## 1. 背景と問題提起

現行の `domain/users` は「関数型DDD」を掲げている。クロージャによるカプセル化・純粋関数・Functional Core / Imperative Shell といった骨格は確かに実現できている。

しかし**「型で表現する」という観点では不十分**である。正当性の担保が、型ではなく **実行時の `throw` ＋「factory 経由でしか生成しない」という運用規約** に依存している。

### 現状の事実（既存コード）

```ts
// domain/users/valueObjects/sub/index.ts
export type Sub = { readonly value: string };
// domain/users/valueObjects/email/index.ts
export type Email = { readonly value: string };
```

`Sub` と `Email` は**構造的に同一の型**。TypeScript は構造的型付けのため、次が**コンパイルを通ってしまう**。

```ts
const email: Email = createSub("auth0|123"); // ✅ 通る（取り違えを型で防げない）
user.changeEmail(createSub("auth0|123")); // ✅ 通る
```

```ts
// createEmail は throw する = 部分関数なのに、シグネチャ上は全域関数に見える
export const createEmail = (value: string): Email => { ... throw ... };
```

### 「型で表現できていない」項目の整理

| 表現したいこと          | 現状の実態                            | 型で表現できているか  |
| ----------------------- | ------------------------------------- | --------------------- |
| Email が正当な形式      | `createEmail` が実行時 `throw`        | ❌                    |
| Email と Sub は別物     | どちらも `{ readonly value: string }` | ❌（構造的に同一）    |
| 処理が失敗しうる        | `throw`（typed error）                | ❌（total に見える）  |
| 登録済み / 未登録の状態 | `User \| null` を引数で運ぶ           | △（状態機械ではない） |

型で担保できているのは**カプセル化の契約**（`User` の振る舞い型 / `UserState` の隠蔽）まで。**妥当性・同一性・失敗・状態遷移**は型の外にある。

---

## 2. 提案

「実行時＋規約」で守っている不変条件を、可能な範囲で**コンパイラが強制する型**に移す。具体的には3点。

### 2-1. ブランド型で同一性を型に出す

```ts
export type Email = { readonly _tag: "Email"; readonly value: string };
export type Sub = { readonly _tag: "Sub"; readonly value: string };
// これで const email: Email = createSub(...) はコンパイルエラーになる
```

`_tag` 判別子により Email と Sub が別の型になり、取り違えを型で封じる。

### 2-2. Result で失敗を型に出す（throw をやめる）

```ts
export const createEmail = (v: string): Result<Email, InvalidEmailFormatError> => ...
```

シグネチャを見ただけで「失敗しうる」と分かり、呼び出し側は分岐を強制される。`Result<T, E>` は最小限（`ok / err / map / flatMap`）を自作。

### 2-3. 状態を判別可能ユニオンで表現する

```ts
export type User =
  | { status: "unregistered"; sub: Sub; email: Email }
  | { status: "registered"; id: string; sub: Sub; email: Email };
// 「未登録なのに id を読む」はコンパイルで弾かれる
```

### 2-4. workflow は Result の合成（railway）でつなぐ

```
既存チェック(short-circuit) → createSub(Result) → createEmail(Result) → RegisteredUser 組み立て
```

副作用（DB fetch / save）は持たず、`existingUser` と `newId` を**引数で受け取る純粋関数**にする（現行 `registerNewUser` と同じ思想）。失敗は `RegisterUserError`（3種のユニオン）に型付けされる。

> 実物は `apps/api-server/src/experiments/typedUserModel/` にある（route / container / DB には未接続の隔離サンプル）。`@ts-expect-error` により、上記のコンパイルエラーが実際に成立することをテストで固定している。

---

## 3. トレードオフ

| 観点              | 現行（throw + `{value}`）              | 本提案（Result + brand + union）   |
| ----------------- | -------------------------------------- | ---------------------------------- |
| 記述量            | 少ない                                 | 増える（Result の連結・分岐）      |
| 失敗の可視性      | シグネチャに出ない                     | 型に出る                           |
| 取り違え防止      | 規約頼み                               | コンパイラが強制                   |
| 状態の不整合防止  | 実行時判定                             | コンパイル時に不可能化             |
| errorMap との接続 | throw を捕捉する既存機構にそのまま乗る | Result → HTTP 変換の設計が別途必要 |
| 学習コスト        | 低い                                   | Result / railway の理解が要る      |

---

## 4. 影響範囲・移行の論点

- **errorMap との接続**: 現行は throw を errorMap で HTTP に変換している。Result 化すると「Usecase 境界で Result を throw に変換する」か「route まで Result を運ぶ」かの設計判断が必要。
- **全ドメインへの波及**: users だけでなく artists / artistProfiles 等にも同じスタイルを広げるかどうか。部分適用は「2つのスタイルが混在する」コストを生む。
- **テスト戦略**: 型レベルの保証は `@ts-expect-error` で固定できる（vitest は型を見ないため `tsc` 必須）。
- **規範の更新**: 全面採用するなら `docs/server-architecture/architecture.md`（VO は `{value:string}` + throw と明記）の更新が前提。コードだけ先行させない。

---

## 5. 未解決の論点（意思決定が必要）

1. **採用範囲**: (a) 不採用のまま現行維持 / (b) 新規ドメインだけ本スタイル / (c) 全面移行
2. **Result の出所**: 自作の最小 `Result` / `neverthrow` 等の既存ライブラリ導入
3. **ブランドの実装**: `_tag` 判別子（本サンプル。ランタイムに値が残る）/ `unique symbol`（型のみ・ゼロコスト）
4. **失敗の運び方**: Result を route まで運ぶ / Usecase 境界で throw へ戻して既存 errorMap に合流

---

## 6. 推奨（たたき台）

- いきなり全面移行はしない。まず **本サンプルで合意形成** → 合意できたら **新規ドメイン1つを本スタイルで実装**して運用感を測る（論点1の (b)）。
- Result は**まず自作最小**で始め、痛みが出たらライブラリ導入を再検討する（論点2）。
- ブランドは**まず `_tag`**（デバッグ時に値が読めて分かりやすい）。ゼロコストが必要になったら `unique symbol` へ（論点3）。
- 合意が取れた時点で本ファイルの内容を `architecture` に昇格し、`docs/discussions/` からは削除する。
