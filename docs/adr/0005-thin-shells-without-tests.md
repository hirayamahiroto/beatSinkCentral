# 0005: 振る舞いの無い薄い殻にはテストを書かない

- ステータス: 採用
- 日付: 2026-09-23
- 出所: [#319](https://github.com/hirayamahiroto/beatSinkCentral/pull/319) §5-5（Issue 7）、[#328](https://github.com/hirayamahiroto/beatSinkCentral/pull/328)

## 背景

欠落テストの穴埋め（Issue 7）で、beatfolio の `middlewares` 4 件、`libs/auth0`、`utils/config`、props 素通しの ClientAdapter 2 件にテストが無いことが挙がった。「全モジュールにテストを書く」方針をそのまま当てると、SDK や env をモックした写しを検証するだけのテストが増える。どこまで書くかの基準が無かった。

## 決定

検証すべき振る舞いが無いモジュールにはテストを書かない。基準は「分岐・変換・ヘッダ転送を一つでも持てば行数に関係なく書く」。

書かない対象:

- `libs/auth0` — Auth0 SDK の生成と呼び出しを包むだけの殻
- `utils/config` — env を読んで定数に束ねるだけ（`appBaseUrl` の解決は `resolve.test.ts` で検証済み）
- props を素通しする ClientAdapter（`PlayersClientAdapter` / `PlayerConceptClientAdapter`）— hook も写像も無い
- 型定義のみのモジュールとバレルファイル

書く対象: middlewares 4 件（`requestContext` / `requireSession` / `auth0` / `basicAuth`）。いずれも分岐かヘッダ転送を持つ。

## 理由

- 薄い殻を Unit で書くと、SDK や env をモックした自分の写しを検証することになり、内部実装の検証（`strategy.md` §12-1 / §12-4）に当たる。
- 「振る舞いがあるか」を基準にすれば、行数や層で例外を列挙せずに判定できる。

## 却下した案

- 全モジュールに一律でテストを義務化する。殻に対しては写しの検証しか書けず、契約が変わっても落ちないテストが増える。

## 結果

- middlewares 4 件にテストを追加（#328）。`libs/auth0` / `utils/config` / 素通し ClientAdapter は無検証のまま残るが、それらの不具合は上位（route / Integration）のテストで顕在化する。
- 「書かなくてよいもの」の判定基準が `strategy.md` §11 に明文化され、以降の欠落テスト調査で同じ基準を使える。
- 殻に分岐や変換が入った時点で、その殻はテスト対象に戻る。

## 影響する規範

- `docs/architecture/testing/strategy.md` §11「書かなくてよいもの」、§7-3「書かなくてよい対象」
