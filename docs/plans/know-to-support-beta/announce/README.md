# 告知素材（T12）— 縦画像 3 枚を 1 人 30 分で作る

> [`plan.md`](../plan.md) の T12（[#283](https://github.com/hirayamahiroto/beatSinkCentral/issues/283)）の成果物。PRD F6（告知素材）・H1（貼った率）・H2（外の人への到達）を繋ぐ**手作業**の道具。生成機能は作らない（PRD §5-1 の原則）。
> 時限ドキュメント。ベータ終了後は参照しない。

## 構成

| ファイル                                                           | 用途                                                             |
| ------------------------------------------------------------------ | ---------------------------------------------------------------- |
| [`templates/01-hook.html`](./templates/01-hook.html)               | 1 枚目: 引っかかり（写真・名前・誰にでも分かる一文・ジャンル）   |
| [`templates/02-translation.html`](./templates/02-translation.html) | 2 枚目: 翻訳の一行（「この人の何が凄いか」）                     |
| [`templates/03-offer.html`](./templates/03-offer.html)             | 3 枚目: オファー（日付・場所・一言）＋ URL / QR                  |
| [`url-sheet.md`](./url-sheet.md)                                   | 人ごとの `?from=announce` 付き URL の一覧（規約と表）            |
| [`request-message.md`](./request-message.md)                       | 貼り方の依頼文（ストーリーズ・ハイライト・bio）                  |
| [`reaction-log.md`](./reaction-log.md)                             | 素材別・文言別の反応の記録シート（§8 月 2 の F6 強化判断に使う） |

3 枚は詳細ページ（PRD §5-2）の区画 1（引っかかり）→ 3（翻訳）→ 5（いま／一つの行動）に対応する。ストーリーズで読んだ順のまま、ページで同じ順に出会う。

## 前提

- テンプレートは外部フォント・外部リソースに依存しない。ブラウザ（Chrome 推奨）でファイルを開けばそのまま 1080×1920 で描画される
- 差し替える箇所はすべて `【…】` のプレースホルダで、画面上で直接クリックして書き換えられる（`contenteditable`）。ファイルをテキストエディタで書き換えてもよい
- 色・角丸は `packages/ui/global.css` のトークン（dark-first）と同じ値を使っている。写真と文章が揃うまで見た目の作り込みはしない（PRD §5-3）

## 手順（1 人あたり 30 分以内）

所要時間の目安を各手順に添える。合計 25 分。

### 0. 材料を揃える（5 分）

[`url-sheet.md`](./url-sheet.md) の行を 1 つ埋める。必要な材料は次の 6 つ。すべて本人のページと編集画面にあるものだけを使う（新しく書かせない）。

| 材料             | 出どころ                                                                                      |
| ---------------- | --------------------------------------------------------------------------------------------- |
| 名前・ジャンル   | 公開ページ区画 1                                                                              |
| 引っかかりの一文 | タグライン。技の名前ではなく、誰にでも分かる一文になっているか本人と確認                      |
| 翻訳の一行       | **翻訳あり群**: 運営が書いた翻訳段落から一文。**翻訳なし群**: 本人の Story の章から一文を抜く |
| 日付・場所・一言 | オファー（区画 5）                                                                            |
| handle           | `/players/<handle>` の `<handle>`                                                             |
| 写真（任意）     | 本人から受け取った画像 1 枚。無ければ写真枠を消してよい                                       |

翻訳なし群の 2 枚目に運営の文を載せると H4（翻訳あり／なし）の割り付けが崩れる。必ず本人の言葉だけを使う。

### 1. テンプレートを開いて差し替える（10 分）

1. Chrome で `templates/01-hook.html` を開く
2. `【…】` をクリックしてその場で書き換える。写真を入れる場合は `.photo` の中身を `<img src="写真のファイル名" alt="" />` に置き換える（同じフォルダに写真を置く）
3. 同じ要領で `02-translation.html` `03-offer.html` を開いて書き換える。3 枚目の URL は [`url-sheet.md`](./url-sheet.md) の値を**コピーして貼る**（手打ちしない）

### 2. スクリーンショットを撮る（5 分）

どちらか一方でよい。出力はどちらも 1080×1920 の PNG になる。

**A. Chrome の DevTools（GUI）**

1. `⌘⌥I` で DevTools を開き、`⌘⇧M` でデバイスツールバーを出す
2. 寸法を `1080 × 1920`、倍率を `100%` にする
3. `⌘⇧P` → `Capture screenshot` を実行する（ページ全体ではなく表示領域）

**B. ヘッドレス Chrome（ターミナル）**

```sh
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --hide-scrollbars --window-size=1080,1920 \
  --screenshot=01-hook.png "file:///絶対パス/01-hook.html"
```

ブラウザ上で書き換えた内容はファイルには保存されないため、B を使う場合はファイル側を書き換える。

### 3. QR を作って貼る（5 分）

QR には [`url-sheet.md`](./url-sheet.md) の `?from=announce` 付き URL をそのまま入れる。無料で使える手段は次の 2 つ。

- **Chrome 内蔵**（インストール不要）: URL を Chrome で開く → アドレスバー右の共有アイコン → 「QR コードを作成」→ ダウンロード
- **qrencode**（コマンド）: `brew install qrencode` のあと `qrencode -o qr.png -s 12 -m 2 "https://<host>/players/<handle>?from=announce"`

貼り方はどちらか。

- 3 枚目のスクリーンショットを撮る**前**に、`03-offer.html` の `.qr` の中身を `<img src="qr.png" alt="" />` に置き換える（推奨。位置ずれが起きない）
- 撮った**後**に、Instagram のストーリーズ編集画面で QR 画像をスタンプとして左下の枠に重ねる

### 4. URL を確認する（5 分）

貼る前に、必ず次の 3 つをスマホで確認する。

1. QR を読み取ると `https://<host>/players/<handle>?from=announce` が開く
2. 開いたページが本人のもので、オファー区画が出ている
3. アドレスバーの URL に `?from=announce` が残っている（リダイレクトで落ちていない）

ここまでで 3 枚の PNG が揃う。[`request-message.md`](./request-message.md) と一緒に本人へ渡し、[`url-sheet.md`](./url-sheet.md) の「渡した日」を埋める。

## `from=announce` の流入を確認する（T07 マージ後）

`profile_view` は T07（[#278](https://github.com/hirayamahiroto/beatSinkCentral/issues/278)）で配線される。マージ前は `analytics_events` に行が入らないので、この節は T07 マージ後に使う。

### 動作確認（自分で 1 回踏む）

1. 素材の QR をスマホで読み取り、ページを開く
2. Supabase の SQL Editor（`docs/architecture/server/database/connection.md`）で直近 10 分の行を見る

```sql
select e.occurred_at, a.handle, e."from", e.path
from analytics_events e
join artists a on a.id = e.artist_id
where e.event_type = 'profile_view'
  and e.occurred_at >= now() - interval '10 minutes'
order by e.occurred_at desc;
```

`"from"` が `announce` の行が 1 件増えていれば配線されている。`from` は予約語なので必ず二重引用符で囲む。

### 週次の集計（reaction-log.md に転記する）

人ごとの `profile_view (from=announce)` 件数。T13（週次の返し）と同じ期間で切る。

```sql
select a.handle, count(*) as announce_views
from analytics_events e
join artists a on a.id = e.artist_id
where e.event_type = 'profile_view'
  and e."from" = 'announce'
  and e.occurred_at >= :week_start
  and e.occurred_at < :week_end
group by a.handle
order by announce_views desc;
```

外の人率（H2）は T08 の一問アンケート `survey_answer` を同じセッションで結ぶ。`props.isBeatboxer` が `false` の割合。

```sql
with announce_sessions as (
  select distinct e.artist_id, e.session_id
  from analytics_events e
  where e.event_type = 'profile_view'
    and e."from" = 'announce'
    and e.occurred_at >= :week_start
    and e.occurred_at < :week_end
)
select a.handle,
  count(*) as answered,
  count(*) filter (where (s.props ->> 'isBeatboxer') = 'false') as outsiders
from analytics_events s
join announce_sessions x on x.artist_id = s.artist_id and x.session_id = s.session_id
join artists a on a.id = s.artist_id
where s.event_type = 'survey_answer'
group by a.handle;
```

この 2 つの数字を素材種別・文言・貼った場所と並べたものが [`reaction-log.md`](./reaction-log.md)。§8 月 2 の判断（外の人が来ていなければ F6 を強化）はそのシートを見て行う。
