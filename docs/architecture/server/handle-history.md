# handle 変更履歴

handle は公開 URL（`/players/[handle]`）を構成する**可変の公開識別子**である（[routing.md](../frontend/routing.md)）。変更すると旧 URL は到達不能になるため、「誰が・いつ・何から何へ」変えたかを残さないと、問い合わせ対応・不正な差し替えの追跡・将来の旧 handle 転送の判断材料がすべて失われる。本ドキュメントは handle 変更に伴う履歴の規範を定める。

## 規範

- **handle の変更は必ず履歴を伴う。** `artists.handle` の更新と `artist_handle_histories` への追記は同一トランザクションで確定する（境界は `ArtistWriteCapabilities`。[architecture.md](./architecture.md#トランザクション境界)）。片方だけが残る状態を作らない
- **同じ handle への変更は履歴を書かない。** 値が変わらない要求は更新も履歴も発生させず、現在の handle をそのまま返す
- **履歴は追記のみ。** 更新・削除・論理削除を持たない。訂正が必要なら新しい行を追記する
- **変更者は Actor の User。** `changed_by_user_id` には操作した本人の `users.id` を入れる。現状 handle を変更できるのは owner のみだが、将来 member が変更できるようになっても列の意味は変わらない
- **履歴の組み立ては Domain Service が担う。** `changeArtistHandle` が重複判定と「差し替え後の Artist」「履歴」の組み立てを持ち、両者を対で返す。usecase は「Artist を保存 → 履歴を保存」の配線だけを持つ。handle を変える経路を新たに足すときは、この Domain Service を通し、返された履歴を必ず保存する
- **並行更新は後勝ち。** `old_handle` は操作者がリクエスト時点で見ていた handle（Actor の解決結果）で、更新は現在値との一致を条件にしない（[concurrency.md](./database/concurrency.md) の本人操作の方針に従う）。同一 Artist への同時変更では、履歴の `old_handle` が直前の行の `new_handle` と一致しないことがある

## 旧 handle の扱い

現時点の決定は次の通り。転送や予約期間を入れる場合は本節を改訂し、履歴の読み取り（Reader）を足す。書き込み側の契約は変えない。

| 観点                                   | 決定                                                                    |
| -------------------------------------- | ----------------------------------------------------------------------- |
| 旧 handle を他の Artist が取得できるか | 変更直後から可能。`artists.handle` の一意制約のみで、予約期間は設けない |
| 旧 handle での `/players/[handle]`     | 404。転送しない                                                         |
| 履歴の参照                             | 現時点では書き込みのみ。参照 API・画面は持たない                        |

## スキーマ

`artist_handle_histories`

| 列                   | 型           | 意味                                                                                              |
| -------------------- | ------------ | ------------------------------------------------------------------------------------------------- |
| `id`                 | uuid         | 履歴の識別子                                                                                      |
| `artist_id`          | uuid FK      | 対象の Artist                                                                                     |
| `old_handle`         | varchar(255) | 変更前の handle                                                                                   |
| `new_handle`         | varchar(255) | 変更後の handle                                                                                   |
| `changed_by_user_id` | uuid FK      | 変更した User                                                                                     |
| `created_at`         | timestamp    | 変更が確定した時刻（DB 既定値。同一トランザクションで追記されるため handle の更新時刻と一致する） |

index: `(artist_id, created_at)`。ある Artist の履歴を時系列で引く用途に合わせる。

旧 `artist_id_histories`（`old_artist_id` / `new_artist_id` / `deleted_at`）は、handle がまだ accountId と呼ばれていた時期の定義で、書き込むコードが存在しなかった。そのためマイグレーション `0009` で drop / create により置き換えている。

## 実装の所在

| 層             | パス                                                                             |
| -------------- | -------------------------------------------------------------------------------- |
| スキーマ       | `packages/database/src/schema/artistHandleHistories.ts`                          |
| ドメイン       | `apps/api-server/src/domain/artistHandleHistories/`                              |
| Domain Service | `apps/api-server/src/domain/services/artistHandleChange/`                        |
| リポジトリ     | `apps/api-server/src/infrastructure/repositories/artistHandleHistoryRepository/` |
| 権能           | `ArtistWriteCapabilities.artistHandleHistories`                                  |
| usecase        | `apps/api-server/src/usecases/users/updateMyHandle/`                             |
