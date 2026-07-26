# Result 境界（Model A） — 検討中 / パイロット

> **ステータス: 検討中（未合意）。** 現行規範は「throw + `onError(handleAppError)`」（`implementation.md`）。本ノートはそれと**併存する移行中の方式**を記述する。合意できたら規範へ昇格し、本ノートは役目を終える。
> パイロット: `usecases/artistProfiles/publishMyProfile`（+ その route）。

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

**「Result 化したので例外は来ない」は成り立たない。** 本パイロットで Result 化したのは _usecase が意図的に返すドメインの失敗_ のみ。以下は引き続き throw で到達する。

- VO の生成（`createEmail` 等）— 別フェーズ
- DB 接続断・制約違反など Drizzle が投げる例外
- バグ由来の `TypeError` 等

したがって `route.ts` の `.onError(handleAppError)` は外せない。Result の役目は「例外を無くす」ことではなく、**「想定内の失敗」と「想定外の例外」を型で分離する**ことにある。前者は戻り値、後者は throw という住み分けになる。

パイロット対象に `publishMyProfile` を選んだのは、失敗が全て policy 由来（VO 生成を含まない）で、**VO を書き換えずに境界の Result 化を検証できる**ため。VO まで Result 化すると全 VO とその呼び出し元（factories 等）に波及するので、別フェーズとして切り出している。

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

## 移行方針（段階導入）

- **エンドポイント単位**で Result 化してよい。移行済みは route で `handleAppError(result.error, c)` を明示呼び出し、未移行は従来どおり throw → グローバル `onError` が捕捉、で**混在してよい**。
- 全エンドポイントが Result 化したら、グローバル `onError` は「想定外例外の最後の砦（500）」だけに縮小できる。

## 未解決の論点

- VO の Result 化まで進めるか（型に完全忠実 vs 全 VO・factories への波及コスト）。
- tx 境界内の `err` によるロールバック欠落を、ルールで縛るか `runResult` で仕組み化するか。
- `respond` ヘルパを導入して route から `errorMap` 依存を外すか（本ノートの推奨は導入）。
- `neverthrow` 等の導入 vs 自作 `Result` の継続。
