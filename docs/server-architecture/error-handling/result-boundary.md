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

## なぜ errorMap を作り替えずに済むか

`AppError` は `Error & { type }` の union で、`errorMap` は `type → { status, message, details }` の表。`handleAppError(error, c)` はこの表で値を HTTP に変換するだけで、**その値が throw されたか return されたかを問わない**。Result の `err` に載る値も同じ `AppError` なので、そのまま渡せる。

## 移行方針（段階導入）

- **エンドポイント単位**で Result 化してよい。移行済みは route で `handleAppError(result.error, c)` を明示呼び出し、未移行は従来どおり throw → グローバル `onError` が捕捉、で**混在してよい**。
- 全エンドポイントが Result 化したら、グローバル `onError` は「想定外例外の最後の砦（500）」だけに縮小できる。

## この方式の範囲と限界（パイロット時点）

- 本パイロットは **Usecase→route の境界**を Result 化しただけ。**VO はまだ throw**（`createEmail` 等）。「失敗を完全に型で表現」するには VO も `Result` を返す必要があり、それは全 VO とその呼び出し元（factories 等）に波及する別フェーズ。
- `publishMyProfile` を選んだのは、失敗が全て policy 由来（VO 生成を含まない）で、**VO を書き換えずに境界 Result 化を検証できる**ため。

## 未解決の論点

- VO の Result 化まで進めるか（型に完全忠実 vs 波及コスト）。
- `handleAppError` 明示呼び出しのボイラープレートを route ヘルパに畳むか。
- `neverthrow` 等の導入 vs 自作 `Result` の継続。
