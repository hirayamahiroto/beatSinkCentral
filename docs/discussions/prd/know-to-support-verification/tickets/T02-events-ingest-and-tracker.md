# T02: 取り込みルート `POST /api/events` と `track()` ラッパ

| 項目 | 内容                         |
| ---- | ---------------------------- |
| 対応 | F5 / 計測基盤設計 §5-3, §5-4 |
| 種別 | 作る                         |
| 依存 | T01                          |
| 規模 | M                            |

## 背景

発火は UI 層・取り込みはエントリ層に置き、ドメイン／データ層に計測を混ぜない（計測基盤設計の原則）。ベンダ SDK / fetch を直接撒かず `track()` 1 枚に集約し、差し替え耐性を持たせる。

## スコープ

### やること

- 取り込みルート（エントリ層）: zod 検証 → insert のみの薄いパススルー。`session_id` / `anon_id` はサーバ側で補完、bot は捨てる、fire-and-forget（204）
- `track()` ラッパ（UI 層から呼ぶ唯一の口）: `sendBeacon` ベース。イベント型は判別可能 union で定義し、イベントごとに必須 props を型で強制する（§13 自己説明性）
- `?from=` クエリの解釈: 詳細ページ到達時に `from` を読み取り、セッション中のイベントへ引き回す仕組み（`none` を既定とするのは「パラメータ無し」が正当な状態のため可）
- 認証不要（大衆の閲覧を計測するため）。API 設計は 1 ファイル 1 エンドポイントの規約に従う

### やらないこと

- イベントの発火点実装（T03・T09〜T11 側）
- 集計・整形（取り込みルートは持たない）

## 受け入れ条件

- [ ] `track()` の型定義だけを見て、どのイベントにどの props が必須か分かる
- [ ] 不正 payload は 4xx で拒否され、DB に到達しない
- [ ] ラッパ以外のファイルに送信実装（fetch / sendBeacon）が存在しない
- [ ] VO / usecase / route にテストがある（`index.test.ts`）

## 参照

- `docs/architecture/server/architecture.md` / `api-design-guidelines.md`
- [`measurement-infrastructure-design.md`](../measurement-infrastructure-design.md) §5-3, §5-4
