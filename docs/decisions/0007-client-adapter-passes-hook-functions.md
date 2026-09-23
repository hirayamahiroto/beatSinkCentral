# 0007: ClientAdapter は hook の関数をラップせず渡す

- ステータス: 提案
- 日付: 2026-09-23
- 出所: [#330](https://github.com/hirayamahiroto/beatSinkCentral/issues/330)

## 決定（案）

1. hook が公開する関数の型は、結合先 organism の callback props の型に一致させる。引数は UI 側の値型、戻り値は `Promise<void>`。hook の公開面は organism の callback と 1:1 にする（`setPublished(boolean)` ではなく `publish` / `unpublish`）。
2. UI 値 → リクエストの写像は hook の内側に置く。ClientAdapter は写像もラップもせず `onSubmit={save}` のように渡すだけにする。
3. organism は非同期 callback を `await` する。callback props の型は `() => Promise<void> | void` とし、ClientAdapter 側に `void fn()` の fire-and-forget を書かせない。
4. hook の戻り値を ClientAdapter が読んで分岐する必要がある場合は、分岐を hook 側へ寄せられないかを先に検討する。寄せられない場合は理由を ADR に残す。

## 理由

- 合成点（hook と organism の結合点）に写像やラップが漏れると、ClientAdapter テストがそれを検証する場所になり、hook 単体で契約を閉じられない。
- `component-design.md`「ClientAdapter から下への受け渡し」の「hook の戻り値を関数・値として UI に渡す」を、型の一致で機械的に強制できる。
- 先例 `useSaveProfile` は `WizardValues` を受けて内部で `toSaveProfileRequest` を呼んでおり、既にこの形。
- 型の裏付け（`tsc --strict` で確認）: `(v) => Promise<void>` は `(v) => Promise<void> | void` にも `(v) => void` にも直接渡せる。`(v) => Promise<boolean>` は前者に渡せない。

## 却下した案

- ClientAdapter でラップし続ける（現状）。判断が実装ごとにばらつき、10 件中 6 件で形が違う。
- organism が BFF リクエスト型を受け取る。`packages/ui` が BFF の型に依存し、Next.js 非依存の境界が崩れる。

## 採用時に確定すること

- organism の `onSubmit` を `Promise<void>` のみに狭めるか。推奨: `Promise<void> | void` を維持。organism は await するので狭めても得るものがなく、Story の `fn()` が窮屈になる。
- Email / Handle の toast と fieldError の出し分けを hook へ寄せるか。`docs/discussions/toast-feedback-design.md` と合わせて判断する。

## 影響する規範

- `docs/architecture/frontend/ui/component-design.md`「ClientAdapter から下への受け渡し」
- `.claude/rules/code-review-checklist.md` §9
