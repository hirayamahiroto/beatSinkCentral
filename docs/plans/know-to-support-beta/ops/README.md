# ベータ運用キット（T11）

> 5〜8 人 × 6〜8 週のベータを、コードに依存せず回すための運用道具一式。[`plan.md`](../plan.md) の T11（[#282](https://github.com/hirayamahiroto/beatSinkCentral/issues/282)）の成果物。
> **時限ドキュメント**。検証の定義は [`prd.md`](../../../discussions/prd/know-to-support-verification/prd.md) §7、話の側（聞き取り）の追加問いは [`concept-and-loops.md`](../../../discussions/prd/know-to-support-verification/concept-and-loops.md) §6-2。
> PRD に無い運用ルールは各ファイルで **案** と明記している。規範ではない。

---

## 索引

| #   | ファイル                                                               | 何か                                                                 | いつ使うか                                                       |
| --- | ---------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------- |
| 1   | [`candidate-list.md`](./candidate-list.md)                             | 候補者リスト（§7-1 の条件列＋所属コミュニティ列、偏りチェック）      | 週 0、声かけの前                                                 |
| 2   | [`outreach-message.md`](./outreach-message.md)                         | 声かけ文面（依頼は 3 つだけ。見本 Story を渡さない）                 | 週 0、候補者に参加を依頼するとき                                 |
| 3   | [`translation-assignment.md`](./translation-assignment.md)             | 翻訳あり／なしの割り付け表と手順（あり群 3〜4 人、開始前に固定）     | 週 0、聞き取り①の後・Story 執筆の前                              |
| 4   | [`interview-scripts.md`](./interview-scripts.md)                       | 聞き取りスクリプト ①開始前・②執筆直後・③告知後と記録形式             | 週 0（①）・週 1（②）・週 6〜8（③）                               |
| 5   | [`translation-confirmation-flow.md`](./translation-confirmation-flow.md) | 翻訳の本人確認フロー（公開前確認）                                   | 週 2〜3、あり群の翻訳を書いたとき                                |
| 6   | [`weekly-checklist.md`](./weekly-checklist.md)                         | 週次進行チェックリスト（§7-4 の週割り）                              | 毎週の先頭と終わり                                               |
| 7   | [`post-live-record-mail.md`](./post-live-record-mail.md)               | ライブ翌日の記録メールの運用手順（写真 1 枚＋一言を手動送信）        | 週 3〜6、参加者のライブの翌日                                    |

## 扱いの約束

- 実名・連絡先・メールアドレス・収入の金額はリポジトリに書かない。仮 ID（`P01`…）で記録し、対応表は運営の手元に置く
- 隣の手作業チケットとの分担: 告知素材は T12（#283）、週次の数字・SQL・台帳は T13（#284）。本キットはそれらを「いつ使うか」で参照するだけで、重複して持たない
