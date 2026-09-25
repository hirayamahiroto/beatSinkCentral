# test-audit — テスト戦略の準拠率と検知力を測る

`docs/architecture/testing/strategy.md` / `background.md` の規則がどれだけ守られているかを、レビューではなく機械で測るためのスクリプト群。三層の指標（`strategy.md` §6 の「数値目標は設けない」と両立する形）:

| 層 | 何を測るか | 道具 | 頻度 |
| --- | --- | --- | --- |
| 構造 | 条件 A〜E への準拠率（偽パスの発生源が塞がっているか） | `scripts/test-audit/index.mjs` | PR ごと（`--strict` でゲート） |
| 検知力 | 実装を壊したときテストが落ちる割合（mutation score） | Stryker | 変更分は PR、全量は nightly |
| 実績 | 本番に漏れたデグレの層別分類 | 手動記録（下記テンプレ） | 発生ごと |

## 何にささるか

このスクリプト群は「テストが緑なら diff を読まずにマージしてよい」と言える状態を作るための計測器で、次の 3 つの決定・規範に直接つながる。

| つながる先 | どうつながるか |
| --- | --- |
| [`docs/architecture/testing/strategy.md`](../../docs/architecture/testing/strategy.md) §5（モック方針）/ §6（カバレッジ方針）/ §9（時間・乱数）/ §11（いつ書くか）/ §12（アンチパターン） | 規範に書かれた「〜しない」を、レビューの目ではなく機械の判定に降ろす。規範と実装のズレを PR ごとに数える |
| [`docs/discussions/autonomous-implementation-structure.md`](../../docs/discussions/autonomous-implementation-structure.md) のマージ基準「required status checks が全緑」 | 全緑を信じてよいかは、テストが偽パスしていないかで決まる。本スクリプトはその前提（緑の信頼性）を測る。ゲートに載せる順序は [first-tasks](../../docs/discussions/autonomous-implementation-first-tasks.md) T1 → T2 の後 |
| [`.claude/rules/code-review-checklist.md`](../../.claude/rules/code-review-checklist.md) §15（テストが変更を検知できる状態か） | 「検知できるか」を人が diff から判断する代わりに、Stryker が実装を壊して実測する |

## 何を担保するか（何を担保しないか）

| 担保するもの | 壊れると何が起きるか | 見る指標 |
| --- | --- | --- |
| 緑が本物である（偽パスの発生源が塞がれている） | 純粋関数をモックで隠す・型なしモック・手書きフィクスチャがあると、実装を壊してもテストが通り、デグレが本番に漏れる | A / B / C |
| 各層が自分の責務だけを検証している | 上層が下層の規則を再検証していると、下層の仕様変更で無関係なテストが大量に落ち、直すために書き換えられて検知力を失う | D |
| モックの台本が実インフラと一致している | 台本と実 DB の振る舞いがずれると、単体は全緑のまま統合で壊れる | E（Phase 2 以降） |
| テストが決定的である | 時刻・乱数を直接呼ぶ純粋層は flaky の発生源になり、再実行で通る習慣が検知力を下げる | 時刻・乱数の直接呼び出し |
| モジュールにテストが存在する | 存在しない挙動への依存は「認知の外」のデグレとして漏れる | テストのないモジュール |
| テストが実装の変更を実際に検知する | アサーションが弱いと構造は正しくても壊れに気づけない | Stryker の mutation score（層別） |

担保しないもの: **要件の網羅性と意図の正しさ**。テストが仕様通りかは人（PRD / ADR に照らす定期評価）の役割で、本スクリプトは「書かれたテストが構造的に信頼できるか」までしか見ない。行カバレッジも合格ラインにはしない（§6）。

## 1. 構造: `index.mjs`

```bash
node scripts/test-audit/index.mjs            # Markdown レポート
node scripts/test-audit/index.mjs --json     # 推移記録・ダッシュボード用
node scripts/test-audit/index.mjs --strict   # 構造違反があれば exit 1（CI）
node scripts/test-audit/index.mjs --out reports/test-audit   # 日時付き .md/.json を溜める（ローカル）
```

依存なし。ルートの `package.json` から `npm run test:audit` / `npm run test:audit:ci`（`--strict`）/ `npm run test:audit:record`（`--out reports/test-audit`）で呼べる。

計測器そのものが偽パスしないよう、違反の形ごとの検出・非検出を `index.test.mjs` で確かめている（`npm run test:audit:test`。CI では `--strict` の前に実行する）。判定を変えたら、すり抜けた形をここにケースとして足す。

### 推移の記録先（ローカル）

`test:audit:record` は `reports/test-audit/`（gitignore 済み）に `<ISO 日時>.md` / `<ISO 日時>.json` と `latest.md` / `latest.json` を書く。JSON には `recordedAt` と `commit`（short SHA）が入るので、複数回分を並べれば commit 単位の推移になる。リポジトリや CI には溜めない（溜め先を変えるときは `--out` を差し替える）。

Stryker のレポート（`apps/api-server/reports/mutation/`）も gitignore 済みのローカル出力だが、実行ごとに上書きされる。

### 出す指標と対応する条件

| 指標 | 条件 | 判定 | 精度 |
| --- | --- | --- | --- |
| 純粋モジュールをモックしているテスト数 | A | `vi.mock` / `vi.doMock`（`import()` 形式を含む）の対象パスが `domain/` `usecases/` 配下、または純粋モジュールから import した束縛への `vi.spyOn` | 確定 |
| 殻モックの型付き率（層別） | B | 合成点テストで型引数のない `vi.fn(…)`・型引数に `any` を含む `vi.fn<…>` が 0 かつ `vi.fn<…>` / `satisfies` がある。`*/testDoubles/*` 経由ならそのモジュールを見る（`vi.fn` を含まないデータだけのモジュールは対象外） | 確定 |
| フィクスチャの factory 導出率 | C | `mockResolvedValue(` の引数が `reconstruct*` / `create*` / `build*` か、封筒か、手書きリテラルか。封筒は判別子（`status` / `kind` / `ok` / `type`）と参照だけのリテラル（`{ status: "complete", actor }` 等）で、中身は factory 由来として導出側に数える | **疑いまで**。BFF の上流レスポンスなど、集約でない値のリテラルも数える |
| 責務漏れの疑い | D | usecase テストに異常系タイトルが 3 件以上（エントリ層の形式検証は自層の責務なので対象外）、`error.message` の検証、usecase での status 検証 | **疑いまで**。確定はレビュー |
| 殻の契約カバー率 | E | usecase / route で `mockResolvedValue` 等の台本が書かれたメソッドが、`*.integration.test.ts` に登場するか | Phase 2 導入後に意味を持つ |
| Repository テストのビルダ呼び出し検証 | §5 ❌例 / §12-1 / §12-4 | `toHaveBeenCalledTimes`、`mockResolvedValueOnce` の連鎖 | 確定 |
| 時刻・乱数の直接呼び出し | §2 / §9 / ADR 0001 | 一覧は `new Date()` `Date.now()` `randomUUID()` `Math.random()` を含む全モジュール。違反として数えるのは domain の時刻・`Math.random()` と usecase の `Math.random()` だけ（`randomUUID()` は純粋扱い、usecase の時刻取得は殻の責務） | 確定 |
| テストのないモジュール | §11 / ADR 0004 / ADR 0005 | `index.ts` に `index.test.ts(x)` がない。型のみ・バレル、マウントのみのルート、props 素通しの ClientAdapter、`NO_TEST_EXEMPT`（testDoubles / packages/ui / 薄い殻）は除外 | ほぼ確定 |

コメントに書かれた `vi.mock(…)` 等は数えない（判定はコメントを除いた本文で行う）。

「確定」の指標は lint で違反を入れさせない。`eslint.rules.mjs` の `testDoubleRules` が、api-server / beatfolio のテストファイルと testDoubles に次を課す（ルールのテストは `apps/api-server/eslint.rules.test.mts`）:

| ルール | 条件 | 止めるもの |
| --- | --- | --- |
| `local-test/no-pure-module-double` | A | `vi.mock` / `vi.doMock` / `vi.mock(import())` の対象が `src/domain` `src/usecases`（相対パス・`@/` エイリアス）、純粋モジュールから import した束縛への `vi.spyOn` |
| `local-test/no-untyped-double` | B | `vi.fn<any>` / `vi.fn<(...args: any[]) => any>` など、型引数に `any` を含む `vi.fn` |

本スクリプトの A / B は、lint を通った後の推移の記録と、lint の対象外に置いたファイルの検出に使う。

### 用語との対応

指標名と設定の識別子は `strategy.md`「用語」の語で読む。

| 識別子 / 指標                     | 用語                                     |
| --------------------------------- | ---------------------------------------- |
| `PURE_SEGMENTS`                   | 核（純粋なモジュールのパス断片）         |
| `COMPOSITION_LAYERS`              | 合成点として扱う層                       |
| A. 純粋モジュールをモックしている | 核をダブルで隠している（偽パス発生源 1） |
| B. 殻モックの型付き率             | 型付きダブルの割合（偽パス発生源 2）     |
| C. フィクスチャの factory 導出率  | 手書きフィクスチャの割合（偽パス発生源 3）|
| D. 責務漏れの疑い                 | 責務漏れ                                 |
| E. 殻の契約カバー率               | 台本が契約テストで裏付けられている割合（偽パス発生源 4） |
| Repository テストのビルダ呼び出し検証 | 実装詳細へのスパイ（§12-1 / §12-4）   |

### 設定

スクリプト冒頭の「設定」ブロックだけを変える:

- `PURE_SEGMENTS` — モック禁止のパス断片
- `LAYER_OF` — パスから層を判定する関数
- `COMPOSITION_LAYERS` — 合成点として扱う層（B / C / D の対象）
- `FACTORY_PREFIXES` — factory と見なす関数名の接頭辞
- `NO_TEST_EXEMPT` — テストを書かない対象のパス（§11 / ADR 0004 / ADR 0005）

## 2. 検知力: Stryker

設定は `apps/api-server/stryker.config.mjs`。

```bash
cd apps/api-server
npm run test:mutation:domain        # まず domain から
npm run test:mutation:incremental   # PR では変更分だけ
npm run test:mutation               # nightly で全量
```

CLI の `--mutate` は設定ファイルの `mutate` 配列を除外パターンごと置き換える。層を絞るときは除外（`!src/**/*.test.ts` 等）も一緒に渡す（`test:mutation:domain` はそうしている）。

読み方:

- **層別の score** を見る。domain は 90% 台が目安、usecase / route は合成の責務だけ検証しているので低くて正常。層をまたいで一つの数字にしない
- **survived mutants の一覧** が本体。「アサーションが弱い」「その分岐は仕様外（テストを足さない）」「到達不能（実装を消す）」に分類し、最初のものだけテストを直す
- `thresholds.break` は `null` のまま。CI を落とす基準にすると数字を上げるためのテストが増える（§6）
- **static mutant の survived は手で確かめる**。モジュール読み込み時に評価される式（`new Map(CODES.map(...))` やモジュール定数）への変異は、vitest runner がモジュールを読み直さないため、テストが落ちるはずでも survived と出ることがある。該当行に同じ変異を手で入れて `vitest run` し、落ちれば計測上の偽 survived として扱う
- 全量は `.github/workflows/mutation.yml` が毎晩実行し、HTML / JSON レポートを artifact に残す（手動実行は `workflow_dispatch`）

## 3. 実績: 漏れたデグレの分類

本番に漏れたデグレを、起きるたびに次の 5 分類で記録する。推移が「偽パス（構造）→ 0 に収束、残るのは認知の外と配線だけ」になれば、設計が機能している証拠になる。

| 分類 | 意味 | 戻す先 |
| --- | --- | --- |
| 認知の外 | テストが存在しなかった挙動への依存 | テスト追加。設計ではなく仕様認知の問題として別に数える |
| 偽パス（構造） | 純粋関数を隠すモック / 型なしモック / 手書きフィクスチャ | 条件 A〜C。`index.mjs` の指標に戻して原因を消す |
| 偽パス（殻） | モックの台本と実インフラの振る舞いのずれ | 契約テスト（統合）にケース追加 |
| 配線・環境 | 設定、接続先、版ずれ | スモークの導線追加 |
| 仕様変更時の判断 | テストは落ちたが「意図した変更」として書き換えられた | レビュー規則 |

記録の形式（Issue のラベルでも、`docs/` の表でもよい）:

```
| 日付 | 症状 | 原因の層 | 分類 | 拾うべきだったテスト | 対応 |
```

## 4. 補助指標（あれば）

| 指標 | 意味 | 取り方 |
| --- | --- | --- |
| 最下層先行率 | 複数層が同時に落ちたとき、最も具体的な失敗が下層に出ていた割合（条件 D の効き） | CI の失敗ログから手動 |
| 偽フェイル率 | 振る舞いを変えていない PR でテストを書き換えた件数 | PR の diff（`*.test.ts` のみ変更）を数える |
| flaky 率 | 再実行で結果が変わるテスト（§9 違反の検出器） | vitest の `--retry` を 0 にして再実行差分を見る |

## 使わない指標

行カバレッジは合格ラインにしない（§6）。domain 層で通っていない分岐の一覧を出す診断用途にだけ使う。

## 導入順

1. ~~`index.mjs` を CI に入れ、A と「型なし殻モック」を `--strict` でゲートにする（構造の穴を塞ぐ）~~ → `.github/workflows/test-audit.yml` で全 PR に対して `npm run test:audit:ci` を実行済み
2. ~~Stryker を domain だけで動かし、survived を読む（アサーションの弱さを見つける）~~ → 初回 95.92%（survived 22）→ テスト追加後 98.70%（survived 7）。残る 7 件は等価変異（どの入力でも実装と区別できない: `calendarDate` の月・日の一致、`imageUrl` の catch、`settle` の下書き分岐）か、static mutant の偽 survived（`presentationPattern` / `storyChapter` の Map 構築）
3. ~~A / B の確定指標を lint に降ろす~~ → `local-test/no-pure-module-double` / `local-test/no-untyped-double`
4. Phase 2（実 DB 統合）が入ったら、契約カバー率を 100% にする
5. デグレが起きた瞬間から分類の記録を始める
