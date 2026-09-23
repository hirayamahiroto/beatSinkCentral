# 0005: 振る舞いの無い薄い殻にはテストを書かない

- ステータス: 採用
- 日付: 2026-09-23
- 出所: [#319](https://github.com/hirayamahiroto/beatSinkCentral/pull/319) §5-5（Issue 7）、[#328](https://github.com/hirayamahiroto/beatSinkCentral/pull/328)

## 決定

検証すべき振る舞いが無いモジュールにはテストを書かない。基準は「分岐・変換・ヘッダ転送を一つでも持てば行数に関係なく書く」。

書かない対象:

- `libs/auth0` — Auth0 SDK の生成と呼び出しを包むだけの殻
- `utils/config` — env を読んで定数に束ねるだけ（`appBaseUrl` の解決は `resolve.test.ts` で検証済み）
- props を素通しする ClientAdapter（`PlayersClientAdapter` / `PlayerConceptClientAdapter`）— hook も写像も無い
- 型定義のみのモジュールとバレルファイル

書いた対象: middlewares 4 件（`requestContext` / `requireSession` / `auth0` / `basicAuth`）。いずれも分岐かヘッダ転送を持つ。

## 理由

薄い殻を Unit で書くと、SDK や env をモックした自分の写しを検証することになり、内部実装の検証（`strategy.md` §12-1 / §12-4）に当たる。

## 却下した案

- 全モジュールに一律でテストを義務化する。殻に対しては写しの検証しか書けない。

## 影響する規範

- `docs/architecture/testing/strategy.md` §11「書かなくてよいもの」、§7-3「書かなくてよい対象」
