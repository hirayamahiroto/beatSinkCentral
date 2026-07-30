# Result 境界（Model A） — 全域に適用済み / 規範昇格待ち

> **ステータス: 全エンドポイントに適用済み（規範への昇格は未実施）。** `implementation.md` は
> 依然「throw + `onError(handleAppError)`」を現行規範として記述しており、実装が先行している状態。
> 本ノートの内容を `implementation.md` へ統合した時点で、本ノートは役目を終える。
>
> 適用範囲: 失敗経路を持つ全 usecase（7本）と全 VO。`usecases/users/getMe` と
> `usecases/linkTypes/listLinkTypes` は失敗経路を持たないため対象外。
> ミドルウェア（`UnauthorizedError`）とバリデータ（`InvalidRequestFormatError`）は
> ハンドラ到達前に打ち切るため throw を維持し、`onError` が捕捉する。

## 何を解決するか

現行は Usecase がドメインの失敗を **throw** し、`onError(handleAppError)` が捕捉して HTTP に翻訳する。動作するが、**失敗が Usecase のシグネチャに現れない**（`Promise<Output>` は成功しか語らない）。呼び出し側は「何がどう失敗しうるか」を型から読めず、握り漏らしても気づけない。

Model A は失敗を **`Result<Output, E>` として返し、型に出す**。route が `ok`/`err` を明示的に分岐する。

## 契約

- **Usecase**: `Promise<Result<Output, AppError のサブセット>>` を返す。ドメインの失敗は `err(createXError())` で返す（throw しない）。
- **route**: `ok` は `c.json(result.value)`、`err` は **既存の `handleAppError(result.error, c)` に値を渡す**。
- **errorMap**: 変更不要。`AppError` の union と翻訳表は throw でも Result でも同じ値に対して働くため、`handleAppError` をそのまま再利用できる。
- **policy**: 変更不要。存在チェックは `if (!x) return err(createXNotFoundError())`、公開可否は既存の純粋関数 `collectMissingPublishFields` を使う。

```typescript
// usecase
export const publishMyProfileUseCase = async (
  input, deps,
): Promise<Result<PublishMyProfileOutput, PublishMyProfileError>> =>
  deps.txRunner.run(async (tx) => {
    const user = await deps.userRepository.findBySub(input.subId, tx);
    if (!user) return err(createUserNotFoundError());
    // ... artist / profile / publishable も同様に err で短絡
    const saved = await deps.artistProfileRepository.setPublished({ ... }, tx);
    return ok({ published: saved.isPublished() });
  });

// route
const result = await publishMyProfileUseCase(input, deps);
if (!result.ok) return handleAppError(result.error, c); // 既存 errorMap を再利用
return c.json(result.value);
```

## Result が持つ効力

### 1. 失敗がシグネチャに出る

throw 版の `Promise<PublishMyProfileOutput>` は「成功したら何が返るか」しか語らない。何がどう失敗しうるかは実装を読まないと分からず、呼び出し側から失敗は不可視だった。

Result 版は `Promise<Result<PublishMyProfileOutput, PublishMyProfileError>>` となり、`UserNotFoundError | ArtistNotFoundError | ArtistProfileNotFoundError | ProfileNotPublishableError` の 4 つが起きうると呼ぶ前に分かる。usecase に失敗パスを足せば union が増えるため、**型が実装と自動で同期する**（コメントや docs のようにズレない）。

### 2. 分岐がコンパイラに強制される

`Result` は判別可能ユニオンなので、`result.ok` で絞らない限り `value` に触れない。

```typescript
const result = await publishMyProfileUseCase(input, deps);
return c.json(result.value); // tsc エラー: value は ok:true 側にしか存在しない
```

throw 版では `const out = await useCase(...)` がそのまま通る。動作はする（`onError` が捕捉する）が、「このエラーだけ 200 で握りつぶす」「別 usecase にフォールバックする」といった分岐を書くとき、型は何も守らない。

### 3. 失敗が「値」になるので扱える

throw は制御フローから飛び出すが、`err(...)` は戻り値にすぎない。そのため以下が可能になる。

- 複数 usecase の結果を `flatMap` で連鎖・集約できる
- テストが `expect(result.error.type)` の値検査になる（`rejects.toThrow` の文字列マッチではない）
- ログ・メトリクスへの分岐を通常の `if` で書ける

## 効力が及ばない範囲

**「Result 化したので例外は来ない」は成り立たない。** Result 化したのは _想定内のドメインの失敗_ のみ。以下は引き続き throw で到達する。

- 認証失敗（`UnauthorizedError`）・リクエスト形式不正（`InvalidRequestFormatError`）
  — ハンドラ到達前に打ち切るため、呼び出し側に分岐の選択肢がない
- DB 接続断・制約違反など Drizzle が投げる例外
- 永続化データが不変条件を満たさない場合（`reconstruct*` の `unwrapOrThrow`）
  — データ破損であり、呼び出し側にできることがない
- バグ由来の `TypeError` 等

したがって `route.ts` の `.onError(handleAppError)` は外せない。Result の役目は「例外を無くす」ことではなく、**「想定内の失敗」と「想定外の例外」を型で分離する**ことにある。前者は戻り値、後者は throw という住み分けになる。

移行は `publishMyProfile`（失敗が全て policy 由来で VO 生成を含まない）から始め、境界の
Result 化を検証したうえで VO とその呼び出し元（factories 等）へ広げた。

## トランザクション境界との相互作用

`txRunner.run` は Drizzle の `db.transaction` そのもので、**ロールバックは throw でしか起きない**。`return err(...)` は正常 return なのでトランザクションは COMMIT される。

```typescript
await repo.setPublished(..., tx);    // 書き込み
if (somethingWrong) return err(...); // ロールバックされない。書き込みが確定する
```

現行の `publishMyProfile` は err の短絡がすべて書き込み前にあるため実害はない。ただし throw 時代に自動で保証されていた「失敗＝ロールバック」は Result 化で失われ、規律に委ねられている。対処案は 2 つ。

- **ルール化**: tx 境界内で `err` を返すのは書き込み前のみ、と定める
- **仕組み化**: `Result` を受け取り err なら rollback する `runResult` を用意する（型で守れるためこちらが望ましい）

## handleAppError が route に現れることの整理

`handleAppError` は `AppError` の値を HTTP に翻訳する処理であり、**元から Presentation 層の持ち物**である（`route.ts` の `.onError` も同じ層）。Result 化で起きたのは層の越境ではなく、呼び出しが「暗黙（グローバル `onError`）」から「明示（route 内）」に変わったことだけ。

ただし放置すると次の 2 点が積み上がる。

1. 各 route が `errorMap` を直接 import し、依存が散らばる
2. `if (!result.ok) return ...` が全 route に複製される

さらに `handleAppError(error: Error, c)` は引数が `Error` のため、**Result で型に出した失敗の union が境界で潰れる**。usecase に variant を足して `errorMap` への登録を忘れても tsc は検知せず、実行時 500 になる。

対策として、Presentation 内に `AppError` で型を締めた薄い adapter を置き、`handleAppError` を route から隠す。

```typescript
// app/api/[[...route]]/respond/index.ts
export const respond = <T>(c: Context, result: Result<T, AppError>) =>
  result.ok ? c.json(result.value) : handleAppError(result.error, c);

// route
return respond(c, await publishMyProfileUseCase(input, deps));
```

- route は `errorMap` を import しない
- `Result<T, AppError>` 制約により、errorMap に無いエラーを usecase が返すとコンパイルエラーになる
- `handleAppError` は `onError` 側＝「想定外例外の最後の砦（500）」として残り、役割が分離する

代替案として「route で `throw result.error` して既存 `onError` に流す」も検討したが、Result にした意味（分岐の型強制）が消え、throw を制御フローに戻すことになるため採らない。

## なぜ errorMap を作り替えずに済むか

`AppError` は `Error & { type }` の union で、`errorMap` は `type → { status, message, details }` の表。`handleAppError(error, c)` はこの表で値を HTTP に変換するだけで、**その値が throw されたか return されたかを問わない**。Result の `err` に載る値も同じ `AppError` なので、そのまま渡せる。

## VO の Result 化と生成元による factory の分離

VO を Result 化すると、Entity を組み立てる factory も Result を返すことになる。このとき
**同じ Entity でも「入力の出所」によって失敗の扱いが変わる**ため、factory を分ける必要がある。
`artistProfiles` では 3 つに分かれている。

| factory                    | 入力の出所           | 失敗の扱い                    |
| -------------------------- | -------------------- | ----------------------------- |
| `createArtistProfile`      | ユーザー入力（新規） | `Result`（422 で返す）        |
| `reviseArtistProfile`      | ユーザー入力（更新） | `Result`（422 で返す）        |
| `reconstructArtistProfile` | DB                   | `unwrapOrThrow`（データ破損） |

分離しないと、DB 復元用の関数にユーザー入力が流れて**入力不正が 500 になる**。
名前で出所が読めるようにしておくこと。

複数フィールドの合成には `utils/result` の `all`（オブジェクト）と `traverse`（配列）を使う。
`flatMap` のネストはフィールド数に比例して深くなるため、3つ以上は `all` を使う。
どちらも**最初の失敗で短絡する**ので、返るエラーは常に1件。

## 移行方針（完了）

エンドポイント単位で Result 化を進め、失敗経路を持つ全 usecase が移行済み。
グローバル `onError` は「想定外例外の最後の砦」に役割が縮小した（ミドルウェア・
バリデータ・データ破損・バグ由来の例外を受ける）。

## 未解決の論点

- **`implementation.md` を規範として更新するか**（現状は実装がドキュメントに先行している）。
- tx 境界内の `err` によるロールバック欠落を、ルールで縛るか `runResult` で仕組み化するか。
  現状は「`err` は書き込み前のみ」という規律に委ねられており、型では守られていない。
- `respond` ヘルパを導入して route から `errorMap` 依存を外すか（本ノートの推奨は導入）。
  現状 `if (!result.ok) return handleAppError(...)` が 7 ルートに複製されている。
- VO エラーを全件返すか（現状は `all` / `traverse` が短絡するため1件のみ。
  `validateRequest` の zod は全件返すので非対称）。
- `neverthrow` 等の導入 vs 自作 `Result` の継続。
