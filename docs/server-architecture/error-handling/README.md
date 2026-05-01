# エラーハンドリング設計

このディレクトリは、本プロジェクトのエラーハンドリング設計を **5つの責務** に分けて整理したもの。

## 構成

| ファイル | 答えている問い | 主な読み手 |
| --- | --- | --- |
| [purpose.md](./purpose.md) | なぜこの設計に投資するのか | PM・新規参画者・運用者 |
| [concepts.md](./concepts.md) | エラーとは何か / 層の独立性とは何か | 設計レビュアー・新人オンボーディング |
| [layer-responsibilities.md](./layer-responsibilities.md) | どの層に何を置くか / バリデーションの責務分離 | 実装者・コードレビュアー |
| [implementation.md](./implementation.md) | どう書くか（co-location / errorMap / onError / 追加手順） | 実装者 |
| [operations.md](./operations.md) | 監視・ログ基盤・SLO 運用にどう繋ぐか | SRE・運用担当 |

## 読み順ガイド

- **これから初めて触る** → `purpose.md` → `concepts.md` → `layer-responsibilities.md` → `implementation.md`
- **新しいエラーを追加したい** → `implementation.md` の「新しいエラーを追加する手順」だけでよい
- **設計レビューをする** → `concepts.md` + `layer-responsibilities.md`
- **監視基盤や SLO に繋ぎたい** → `operations.md`

## 設計の3行サマリ

- エラーは「失敗の事実」ではなく「**何のルールが、どう違反されたか**」を伝える情報資産である
- ルールは層ごとに異なるので、**エラー定義もルールを知っている層に co-located** で置く
- HTTP への翻訳は `errorMap` だけが行い、ドメインや usecase は HTTP を知らない
