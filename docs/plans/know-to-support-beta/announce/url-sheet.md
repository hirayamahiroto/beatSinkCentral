# 人ごとの告知 URL 一覧

> 全素材（3 枚目の QR / URL、ストーリーズのリンクスタンプ、ハイライト、bio）に載せる URL はこの表の値だけを使う。手打ちせずコピーする。

## 規約

```
https://<host>/players/<handle>?from=announce
```

- `<host>`: ベータで使う本番ホスト。表の右上に 1 回だけ書き、全行で同じ値を使う
- `<handle>`: 公開ページ `/players/[handle]` の handle（`docs/architecture/frontend/routing.md`）。本人が handle を変えたら行を更新し、古い素材を貼り直してもらう
- `?from=announce`: 参照元。値は PRD §6-1 の `from`（`announce` / `share` / `search` / `invite` / `none`）のうち **`announce` 固定**。ストーリーズ・ハイライト・bio のどこに置いても同じ値にする（置き場所の違いは [`reaction-log.md`](./reaction-log.md) の「貼った場所」列で持ち、URL では分けない）
- 他のクエリを足さない（`utm_*` 等）。計測は `from` だけを見る

## 表

host: `https://________`

| handle | 名前 | 翻訳 | URL（コピー用）                                 | 素材を渡した日 | 貼った日（本人申告） | 備考 |
| ------ | ---- | ---- | ----------------------------------------------- | -------------- | -------------------- | ---- |
|        |      | あり | `https://<host>/players/<handle>?from=announce` |                |                      |      |
|        |      | なし | `https://<host>/players/<handle>?from=announce` |                |                      |      |
|        |      |      |                                                 |                |                      |      |
|        |      |      |                                                 |                |                      |      |
|        |      |      |                                                 |                |                      |      |
|        |      |      |                                                 |                |                      |      |
|        |      |      |                                                 |                |                      |      |
|        |      |      |                                                 |                |                      |      |

- 「翻訳」列は T11 の割り付け表と一致させる（あり群の 2 枚目だけ運営の翻訳を使う）
- 「貼った日」は H1（貼った率）の元データ。聞き取り③でも確認する
