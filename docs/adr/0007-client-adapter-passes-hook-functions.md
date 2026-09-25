# 0007: ClientAdapter は hook の関数をラップせず渡す

- ステータス: 提案
- 日付: 2026-09-23
- 出所: [#330](https://github.com/hirayamahiroto/beatSinkCentral/issues/330)

## 背景

`OfferEditorClientAdapter` は hook の `save` をそのまま organism に渡せず、`async (values) => { await save(toSaveOfferRequest(values)); }` とラップしている。`save` の引数型が BFF リクエスト型で、organism の `onSubmit: (values: OfferEditorValues) => Promise<void> | void` と一致していないためで、UI 値 → リクエストの写像が ClientAdapter 側にある。

同じ形のラップは 10 件の ClientAdapter のうち 6 件にあり、`void fn()` の fire-and-forget、`Promise<boolean>` の戻り値を捨てる async ラップ、Result を読んで toast を出し分ける関数、と形がばらついている。`component-design.md` は「hook の戻り値を関数・値として UI に渡す」としているが、hook の関数型を organism の props 型に合わせる責務がどちらにあるかを書いていない。

## 決定（案）

1. hook が公開する関数の型は、結合先 organism の callback props の型に一致させる。引数は UI 側の値型、戻り値は `Promise<void>`。hook の公開面は organism の callback と 1:1 にする（`setPublished(boolean)` ではなく `publish` / `unpublish`）。
2. UI 値 → リクエストの写像は hook の内側に置く。ClientAdapter は写像もラップもせず `onSubmit={save}` のように渡すだけにする。
3. organism は非同期 callback を `await` する。callback props の型は `() => Promise<void> | void` とし、ClientAdapter 側に `void fn()` を書かせない。
4. hook の戻り値を ClientAdapter が読んで分岐する必要がある場合は、分岐を hook 側へ寄せられないかを先に検討する。寄せられない場合は理由をこの ADR に追記する。

## 理由

- 合成点（hook と organism の結合点）に写像やラップが漏れると、ClientAdapter テストがそれを検証する場所になり、hook 単体で契約を閉じられない。
- 「関数・値として渡す」という文章の規範を、型の一致というコンパイラが検査できる規範に変えられる。ラップを禁じれば、型が合わない時点で `onSubmit={save}` がコンパイルエラーになる。
- 先例 `useSaveProfile` は `WizardValues` を受けて内部で `toSaveProfileRequest` を呼んでおり、既にこの形。
- 型の裏付け（`tsc --strict` で確認）: `(v) => Promise<void>` は `(v) => Promise<void> | void` にも `(v) => void` にも直接渡せる。`(v) => Promise<boolean>` は前者に渡せない。

## 却下した案

- ClientAdapter でラップし続ける（現状）。判断が実装ごとにばらつき、10 件中 6 件で形が違う。
- organism が BFF リクエスト型を受け取る。`packages/ui` が BFF の型に依存し、Next.js 非依存の境界が崩れる。

## 結果

- hook が `packages/ui` の値型（`OfferEditorValues` 等）に依存する。`apps/` 側の hook なので許容範囲（`useSaveProfile` と同じ）。
- ClientAdapter テストは「organism のフォーム値がそのまま hook に渡る」ことだけを見る。写像の検証は hook テストへ移り、`vi.fn<Hook["save"]>()` で hook の型に縛られるため、関数型の変更をコンパイルで検知できる。
- organism 側で `() => void` の callback props を `() => Promise<void> | void` に変え、内部で `await` する変更が数件発生する。
- 採用時に確定すること:
  - organism の `onSubmit` を `Promise<void>` のみに狭めるか。推奨: `Promise<void> | void` を維持。organism は await するので狭めても得るものがなく、Story の `fn()` が窮屈になる。
  - Email / Handle の toast と fieldError の出し分けを hook へ寄せるか。`docs/discussions/toast-feedback-design.md` と合わせて判断する。

## 影響する規範

- `docs/architecture/frontend/ui/component-design.md`「ClientAdapter から下への受け渡し」
- `.claude/skills/code-review-checklist/SKILL.md` §9
