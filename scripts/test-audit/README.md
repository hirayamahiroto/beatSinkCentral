# test-audit — テスト戦略の準拠率と検知力を測る

`docs/architecture/testing/strategy.md` / `background.md` の規則がどれだけ守られているかを、レビューではなく機械で測るためのスクリプト群。三層の指標（`strategy.md` §6 の「数値目標は設けない」と両立する形）:

| 層 | 何を測るか | 道具 | 頻度 |
| --- | --- | --- | --- |
| 構造 | 条件 A〜E への準拠率（偽パスの発生源が塞がっているか） | `scripts/test-audit/index.mjs` | PR ごと（`--strict` でゲート） |
| 検知力 | 実装を壊したときテストが落ちる割合（mutation score） | Stryker | 変更分は PR、全量は nightly |
| 実績 | 本番に漏れたデグレの層別分類 | 手動記録（下記テンプレ） | 発生ごと |

## 1. 構造: `index.mjs`

```bash
node scripts/test-audit/index.mjs            # Markdown レポート
node scripts/test-audit/index.mjs --json     # 推移記録・ダッシュボード用
node scripts/test-audit/index.mjs --strict   # 構造違反があれば exit 1（CI）
node scripts/test-audit/index.mjs --out reports/test-audit   # 日時付き .md/.json を溜める（ローカル）
```

依存なし。ルートの `package.json` から `npm run test:audit` / `npm run test:audit:ci`（`--strict`）/ `npm run test:audit:record`（`--out reports/test-audit`）で呼べる。

### 推移の記録先（ローカル）

`test:audit:record` は `reports/test-audit/`（gitignore 済み）に `<ISO 日時>.md` / `<ISO 日時>.json` と `latest.md` / `latest.json` を書く。JSON には `recordedAt` と `commit`（short SHA）が入るので、複数回分を並べれば commit 単位の推移になる。リポジトリや CI には溜めない（溜め先を変えるときは `--out` を差し替える）。

Stryker のレポート（`apps/api-server/reports/mutation/`）も gitignore 済みのローカル出力だが、実行ごとに上書きされる。

### 出す指標と対応する条件

| 指標 | 条件 | 判定 | 精度 |
| --- | --- | --- | --- |
| 純粋モジュールをモックしているテスト数 | A | `vi.mock` の対象パスが `domain/` `usecases/` 配下 | 確定 |
| 殻モックの型付き率（層別） | B | 合成点テストで `vi.fn()` が 0 かつ `vi.fn<…>` / `satisfies` がある。`*/testDoubles/*` 経由ならそのモジュールを見る | 確定 |
| フィクスチャの factory 導出率 | C | `mockResolvedValue(` の引数が `reconstruct*` / `create*` / `build*` か、オブジェクトリテラルか | **疑いまで**。BFF の上流レスポンスなど、集約でない値のリテラルも数える |
| 責務漏れの疑い | D | 合成点テストに異常系タイトルが 3 件以上、`error.message` の検証、usecase での status 検証 | **疑いまで**。確定はレビュー |
| 殻の契約カバー率 | E | usecase / route で `mockResolvedValue` 等の台本が書かれたメソッドが、`*.integration.test.ts` に登場するか | Phase 2 導入後に意味を持つ |
| Repository テストのビルダ呼び出し検証 | §5 ❌例 / §12-1 / §12-4 | `toHaveBeenCalledTimes`、`mockResolvedValueOnce` の連鎖 | 確定 |
| 時刻・乱数の直接呼び出し | §2 / §9 | `new Date()` `Date.now()` `randomUUID()` を含む純粋層モジュール | 確定 |
| テストのないモジュール | §11 | `index.ts` に `index.test.ts(x)` がない（型のみ・バレルは除外） | ほぼ確定 |

「確定」の指標は lint 化して違反を入れさせないほうが安い。ESLint の `no-restricted-syntax` で A はそのまま書ける:

```js
// eslint.rules.mjs に追加（テストファイル対象）
{
  selector: 'CallExpression[callee.object.name="vi"][callee.property.name="mock"][arguments.0.value=/\\/(domain|usecases)\\//]',
  message: "純粋モジュール（domain / usecases）はモックしない。実物を呼ぶ（strategy.md §5、background.md §3）。",
},
```

### 設定

スクリプト冒頭の「設定」ブロックだけを変える:

- `PURE_SEGMENTS` — モック禁止のパス断片
- `LAYER_OF` — パスから層を判定する関数
- `COMPOSITION_LAYERS` — 合成点として扱う層（B / C / D の対象）
- `FACTORY_PREFIXES` — factory と見なす関数名の接頭辞

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

1. `index.mjs` を CI に入れ、A と「型なし殻モック」を `--strict` でゲートにする（構造の穴を塞ぐ）
2. Stryker を domain だけで動かし、survived を読む（アサーションの弱さを見つける）
3. Phase 2（実 DB 統合）が入ったら、契約カバー率を 100% にする
4. デグレが起きた瞬間から分類の記録を始める
