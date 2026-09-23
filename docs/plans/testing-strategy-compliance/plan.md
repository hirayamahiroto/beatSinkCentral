# 実行計画 — テスト戦略ドキュメント準拠の是正

> 2026-09-20 の監査草案（`strategy.md` / `README.md` / checklist §15 準拠監査、Issue 1〜8）を実行に落とす計画。
> **時限ドキュメント**（`plans/` の規約どおり、全 Issue close 後は参照しない）。
> 規範は `docs/architecture/testing/strategy.md`。本書は着手順・依存・PR 分割だけを持ち、各 Issue の受け入れ条件の正本は GitHub Issue とする。

- 監査対象コミット: `4dbc02c`（本計画の裏取りは `16896be` で再実施。差分は本書 §1 に記す）
- 統合 Issue: （起票後に記入）
- ラベル: `test` を全件に付け、既存ラベル体系に合わせる

---

## 1. 裏取り結果（`16896be`）

監査草案の主張はすべてリポジトリで再現した。草案との差分・追加発見は次のとおり。

| 観点                                 | 草案                                                | 再確認                                                                                                                                                                                                                                                                                                               |
| ------------------------------------ | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| テストファイル数                     | api-server 128 / beatfolio 79 / ui 0                | api-server 130 / beatfolio 79 / ui 0（#314 以降の増分）                                                                                                                                                                                                                                                              |
| Issue 1 対象                         | 16 ファイル                                         | `vi.mock(".../infrastructure/capabilities")` を使うルートテスト 19、うち `satisfies` なし 18                                                                                                                                                                                                                         |
| Issue 3 `toHaveBeenCalledTimes` 件数 | 草案どおり                                          | 9 リポジトリ・計 36 箇所（artistRepository 14 が最大）                                                                                                                                                                                                                                                               |
| Issue 5                              | beatfolio CI が test 未実行                         | 加えて **api-server / beatfolio に `check-types` script が無く、共通アクションの型検査ステップは turbo が no-op で通過している**。テストファイルの型エラーは現状どこでも検出されない                                                                                                                                 |
| Issue 6                              | 7 箇所                                              | 草案どおり 9 行（domain factories 7 + usecases/offers 2）                                                                                                                                                                                                                                                            |
| Issue 7 beatfolio                    | ClientAdapter 4 件 + BFF 1 件 + errors 7 件 + auth0 | 加えて `middlewares/{requestContext,requireSession,auth0,basicAuth}`、`utils/config`、`OfferEditorClientAdapter`、`OnboardingClientAdapter`、`PlayersClientAdapter`、`PlayerConceptClientAdapter` がテスト無し。草案の切れた部分に含まれていた可能性があるため、Issue 起票時に「テスト不要」判定の対象として明記する |
| Issue 8                              | リンク切れ多数                                      | `docs/testing/*`、`docs/templates/test-cases.md`、`docs/server-architecture/...`、`OVERVIEW.md`、checklist「14. テスト要件」がすべて実体なし                                                                                                                                                                         |

---

## 2. 依存関係と着手順

```
Phase A（基盤・小・即効）      Phase B（契約を型で縛る）        Phase C（Repository）        Phase D（穴埋め）
 A1 Issue 8 docs ─────┬──────▶ B2 Issue 1 api-server route mock
                      ├──────▶ B3 Issue 2 BFF route mock
 A2 Issue 5 CI ───────┘        B1 Issue 6 clock/idGen ──▶ (B2 の前に入れると型変更の二度手間を避けられる)
                                                            C1 Issue 4 integration ──▶ C2 Issue 3 mock 撤去
                                                                                       D1 Issue 7 欠落テスト（随時・並行可）
```

理由:

- **A1 → B2/B3**: 「設計ドキュメントが規範」（CLAUDE.md）。型付きモックの規則を `strategy.md` §5 に書いてから、コードをそれに合わせる。草案どおり現状の §5 例は型なしモックを肯定している。
- **A2 と T1 の関係**: 本計画は自律実装の議論（`docs/discussions/autonomous-implementation-*.md`）とは独立に進めるが、Issue 5 だけは T1 と同じ穴を指す。T1 が先に合意されれば A2 は T1 の一部として実行し、本計画の依存は「T1 完了」に読み替える。
- **A2 → B2/B3**: Issue 1・2 の完了条件は「契約変更でテストがコンパイルで落ちる」。`check-types` がテストファイルを含めて CI で走らない限り、この完了条件は担保されない。
- **B1 → B2**: Issue 6 で capabilities の型に `clock` / `idGen` を足す。Issue 1 で route mock を `satisfies` で縛った後に足すと 18 ファイルを再度触る。先に入れるのが安い。ただし B1 は設計判断（§5 要判断）が要るため、判断が遅れる場合は B2 を先行させてよい。
- **C1 → C2**: Issue 3 のビルダ spy テストは、実 DB 統合が無い現状では「唯一の Repository 検証」。先に消すと安全網が薄くなる。Integration を先に入れ、mock ベースのテストは「純粋な行→集約写像のテスト」だけ残して撤去する。
- **D1 は独立**: 各 PR は小さく、いつでも並行できる。ただし Issue 8 で「テスト不要」の判断基準が決まってから着手すると、書かなくてよいものを書かずに済む。

---

## 3. 各 Issue の PR 分割

規模は S（半日以内）/ M（1〜2 日）/ L（3 日〜）。すべての PR で `lint` → `knip` → `tsc --noEmit` → `test` を通す（checklist §6-1、§15）。実装コメントは足さない。

### Phase A

| PR             | 内容                                                                                                                                                                                                                                                                                                                                                                    | 規模 | 完了条件                                                 |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | -------------------------------------------------------- |
| A1-1 (Issue 8) | `README.md` / `strategy.md` のパスを実体に合わせる。`guidelines.md` / `test-cases.md` / `OVERVIEW.md` は「想定アーティファクト」から落とす（作らない）。checklist 参照は §15 へ                                                                                                                                                                                         | S    | 参照先がすべて存在する                                   |
| A1-2 (Issue 8) | `strategy.md` §5 に「モックは依存先のインターフェース型を `vi.fn<I["method"]>()` + `satisfies I` で参照する」を追加し、例を差し替える。§10 に `resolve.test.ts` / `middleware.test.ts` の配置例外を明文化。§7-3 の「必ず書く対象」を Issue 4 の受け入れ条件に転記できる粒度にする                                                                                       | S    | Issue 1・2 が参照する規範文が存在する                    |
| A2-1 (Issue 5) | `beatfolio.yml` を `.github/actions/build-and-test` に乗せ替える。**`docs/discussions/autonomous-implementation-first-tasks.md` の T1（`ci.yml` 一本化）が合意されるなら本 PR は T1 に吸収し、単独では行わない**。T1 は `packages/database` / `packages/ui` の vitest 未実行・`deploy-preview.yml` との重複・Node バージョン不揃いまで対象にしており、本 Issue より広い | S    | beatfolio PR で 79 テストが走る                          |
| A2-2 (Issue 5) | api-server / beatfolio に `"check-types": "tsc --noEmit"` を追加。tsconfig の `include` がテストファイルを含むことを確認。`packages/ui` の `test` script は CI から外すか削除するかを決める（§5）。T1 に吸収する場合も `check-types` script の追加は T1 の完了条件に含める                                                                                              | S    | テストファイルの型エラーが `next build` に依存せず落ちる |

### Phase B

| PR             | 内容                                                                                                                                                                                                                                          | 規模 | 完了条件                                                                 |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ------------------------------------------------------------------------ |
| B1-0 (Issue 6) | **決定済み（2026-09-23、#325）**: `architecture.md` の立場（ID 採番は factory に閉じ、テストではスタブ）を採り、`strategy.md` / `background.md` をそろえる。caps に `clock` / `idGen` は足さない                                              | S    | 規範の食い違いが無い                                                     |
| B1-1 (Issue 6) | **完了（#324）**: 実装は `analyticsEvents` factory の `new Date()` 1 箇所のみ（`occurredAt` を usecase から渡す）。offers usecase の `new Date()` は殻での取得で違反ではない。factory 7 箇所の `crypto.randomUUID()` は規範適合として現状維持 | S    | domain factory に `new Date()` が無い                                    |
| B2-1 (Issue 1) | `apps/api-server/src/app/api/[[...route]]/fixtures.ts`（または各 feature 配下）に `createMockReader<I>()` 相当のヘルパーを置き、artists 配下 9 ファイルを移行                                                                                 | M    | `IArtistProfileReader` にメソッドを足すと該当テストがコンパイルで落ちる  |
| B2-2 (Issue 1) | 残り 9 ファイル（users / story-questions / link-types / public）を移行                                                                                                                                                                        | S    | 18 ファイルすべて `satisfies`                                            |
| B3-1 (Issue 2) | `jsonResponse<T>()` を型引数付きにし、hono の `InferResponseType` で上流レスポンス型を参照するヘルパーを `fixtures.ts` に置く。artists/me 配下 6 ファイルを移行                                                                               | M    | api-server 側でフィールドをリネームすると BFF テストがコンパイルで落ちる |
| B3-2 (Issue 2) | 残り 3 ファイル（users/me / events / dashboard）。手書きの `api.users.me.$get` 構造を `RequestContextEnv` 経由の型付き偽クライアント注入に置換できるか検討し、できなければ `satisfies DeepPartial<...>` で縛る                                | S    | 手書き構造が無いか、型検査されている                                     |

### Phase C

| PR             | 内容                                                                                                                                                                                                                    | 規模 | 完了条件                                               |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ------------------------------------------------------ |
| C1-0 (Issue 4) | DB 起動方式を決める（§5）。vitest を `unit` / `integration` の project に分け `test:integration` script を追加。CI に Postgres を足しマイグレーション適用後に integration を走らせる骨格だけ入れる（テスト 1 本）       | M    | CI で integration が緑                                 |
| C1-1 (Issue 4) | §7-3「必ず書く対象」を埋める: reconstruct が throw する不正行、handle / email の一意制約違反が typed error として伝播、`deletedAt` フィルタ。リポジトリ 9 件を順に                                                      | L    | `strategy.md` §0 の表を「Integration（整備済）」に更新 |
| C2-1 (Issue 3) | 行 → 集約の写像を純粋関数として切り出し（呼び手はリポジトリ本体）、単体テストを付ける。ビルダ spy の `toHaveBeenCalledTimes` / `mockResolvedValueOnce` 連鎖を撤去し、Integration で担保されたケースの mock テストを削除 | M    | repository テストにビルダ spy への回数検証が無い       |

### Phase D

| PR             | 内容                                                                                                                                                                     | 規模 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---- |
| D1-1 (Issue 7) | **対象外**: `presentation-patterns/listPresentationPatterns` は親ディレクトリの `presentation-patterns/index.test.ts` がマウント経由で検証している                       | —    |
| D1-2 (Issue 7) | **完了（#326、ベースは #322）**: BFF `users/createUser`、`errors/*` 7 件                                                                                                 | S    |
| D1-3 (Issue 7) | **完了（#327）**: ClientAdapter 5 件（ProfileWizard / PresentationPattern / ProfilePublish / OfferEditor / Onboarding）。Players / PlayerConcept は props 素通しで対象外 | M    |
| D1-4 (Issue 7) | **完了（#328）**: middlewares 4 件はテストを追加。`libs/auth0` / `utils/config` / 素通し ClientAdapter は「書かなくてよいもの」として `strategy.md` §11 に明文化         | S    |
| D1-5           | `apps/api-server/.../test/get` サンプルルートの削除（knip で呼び手なしなら）                                                                                             | S    |

---

## 4. 進め方

1. 本計画に合意後、Issue 1〜8 を GitHub に起票し、統合 Issue で束ねる（本書 §3 の PR 分割を各 Issue の「PR 分割」節に転記）
2. Phase A の 4 PR を最初の 1 週で終える。ここまでで CI が「テストが走る・型が検査される」状態になる
3. Phase B は B2-1 → B3 → B1 の順で完了（#321 / #322 / #324 / #325）
4. Phase C は C1-0 で方式を固めてから。C2 は C1-1 が終わるまで着手しない
5. Phase D は Phase A 完了後、空いた時間で随時

---

## 5. 要判断事項（着手前に決める）

6 件すべて決定済み。決定の本文・理由・却下した案は `docs/adr/`（ADR）に置き、本書はリンクだけを持つ。

| #   | 論点                                                   | ADR                                                                                                   | 影響する PR |
| --- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- | ----------- |
| 1   | Issue 6: `clock` / `idGen` を caps に持たせるか        | [0001](../../adr/0001-domain-factory-clock-idgen.md) — 持たせない（#325 / #324 で実施済み）           | B1-0, B1-1  |
| 2   | Issue 4: CI の DB 起動方式                             | [0002](../../adr/0002-integration-test-db-postgres-service-container.md) — Postgres service container | C1-0        |
| 3   | Issue 3 を Issue 4 の前に部分着手するか                | [0003](../../adr/0003-repository-mock-removal-after-integration.md) — しない                          | C2-1        |
| 4   | `packages/ui` の `test` script                         | [0004](../../adr/0004-packages-ui-test-script.md) — 0 件のあいだ削除                                  | A2-2        |
| 5   | Issue 7 の middlewares / `libs/auth0` / `utils/config` | [0005](../../adr/0005-thin-shells-without-tests.md) — 殻は書かない（#328 で実施済み）                 | D1-4        |
| 6   | `guidelines.md` / `test-cases.md` を作るか             | [0006](../../adr/0006-no-guidelines-and-test-cases-docs.md) — 作らない（#320 で実施済み）             | A1-1        |
