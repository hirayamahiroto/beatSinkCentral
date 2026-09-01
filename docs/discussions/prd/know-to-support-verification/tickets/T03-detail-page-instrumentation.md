# T03: 詳細ページの計測配線（`from` / `position` 付き）

| 項目 | 内容                  |
| ---- | --------------------- |
| 対応 | F5, H2, H3 / PRD §6-1 |
| 種別 | 作る                  |
| 依存 | T02, T08              |
| 規模 | M                     |

## 背景

H2（大衆到達）と H3（知る→来場）の判定材料。特に `offer_click` の `position`（`hero` / `after-story`）が「読む前／読んだ後」の照合キーになる（PRD §4 H3）。

## スコープ

### やること

- 詳細ページに以下を配線する:

| イベント        | 発火点                      | props                                |
| --------------- | --------------------------- | ------------------------------------ |
| `profile_view`  | 詳細表示（セッション 1 回） | `from`                               |
| `story_expand`  | 「続きを読む」展開          | —                                    |
| `story_scroll`  | 25/50/75/100% 到達          | `depth`                              |
| `offer_click`   | オファーのボタン            | `position`（`hero` / `after-story`） |
| `support_click` | SNS・フォロー等             | `platform`, `position`               |

- `story_scroll` は IntersectionObserver、送信は `sendBeacon`（離脱の取りこぼし防止）
- 人ごとの参照元付き URL（`?from=announce`）が `profile_view` に正しく乗ることの確認

### やらないこと

- `survey_answer`（T09）/ `notify_subscribe`（T10）/ `invite_open`・`invite_signup`（T11）— それぞれの機能チケット側で配線する
- 数値の可視化（T14 の ad-hoc SQL で読む）

## 受け入れ条件

- [ ] `?from=announce` 付きで開く → `profile_view` に `from=announce` が記録される（5 値すべて確認）
- [ ] オファーの hero ボタンと after-story ボタンで `position` が区別されて記録される
- [ ] ページ離脱直前の `story_scroll` が欠落しない（sendBeacon 経由）
- [ ] 計測コードがドメイン／データ操作層に存在しない（UI 層のみ）
