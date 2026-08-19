# api-server セキュリティ調査（2026-08-11 時点）

Issue #158（api-server の Next.js 剥がし）に着手する前に、現在の api-server / BFF 周辺の実装を対象にセキュリティ観点で調査した記録。

本ドキュメントは `docs/discussions/` 配下＝**未合意の調査結果**であり、規範ではない。対応方針が合意できた項目は Issue 化し、恒久的な設計判断は `docs/architecture/` 側へ昇格させる。

> **追記（2026-08-19）**: Issue #158（Next.js 剥がし / Hono standalone 化）は方針転換により中止した（PR #201 クローズ）。api-server は「Next.js の殻 + Build-in Hono」という現構成を維持する。理由は、Next.js を剥がすとモノレポのツールチェーン問題（`packages/database` の dist ビルド・`.js` 拡張子必須・ビルド順序依存）を自前で背負うことが移行作業で判明したため。
>
> 本ドキュメントの所見は main の実装に対する調査結果としてそのまま有効。ただし「本 PR で対応」とした項目（S-3、S-5 の一部、S-9 の緩和準備）は PR クローズに伴い **main には未反映**であり、対応が必要な状態に戻っている。`refactor/api-server-hono-only` ブランチに参考実装（`hono/basic-auth` 化、hono `^4.13` への更新、未使用 `uuid` の削除、jose + hkdf による framework 非依存のセッション復号）が残っているため、移植候補とする。

## 調査範囲

| 対象                     | 見たもの                                                                                             |
| ------------------------ | ---------------------------------------------------------------------------------------------------- |
| 認証・認可               | `middlewares/auth0`, `infrastructure/auth0`, `usecases/authorization`, `infrastructure/capabilities` |
| Basic 認証               | `middleware.ts`, `middlewares/basicAuth`                                                             |
| 入力検証                 | 全 11 エンドポイントの zod スキーマ、`domain/**/valueObjects/**`                                     |
| データアクセスのスコープ | `infrastructure/repositories/**`                                                                     |
| ログ・エラー応答         | `errorMap`, `utils/logger`, `utils/requestContext`                                                   |
| BFF ↔ api-server の境界 | `apps/beatfolio/src/utils/client`, `apps/beatfolio/src/middleware.ts`                                |
| 依存パッケージ           | `npm audit`（ルートワークスペース）                                                                  |
| シークレットの扱い       | `infrastructure/*.tf`, `.gitignore`, git 追跡状況                                                    |

調査は**静的な読み取りと局所的な実行確認のみ**。稼働環境への能動的なテスト（実際のリクエスト送信、preview へのペネトレーション）は行っていない。

## 現在の認証構成（実態）

```text
ブラウザ
  │  Cookie: __session（Auth0 SDK が発行した JWE。beatfolio のドメインに紐づく）
  ▼
beatfolio（Next.js + Auth0 SDK）
  │  createApiServerClient() が cookie ヘッダをそのまま転送
  │  ※ Authorization ヘッダは送らない
  ▼
api-server（Next.js + Auth0 SDK）
     auth0.getSession() が next/headers 経由で __session を読み、
     beatfolio と共有した AUTH0_SECRET で復号して sub を得る
```

つまり **api-server は「Auth0 セッション Cookie を自分で復号できること」を本人性の根拠にしている**。この構成が後述 S-6 / S-9 の前提になる。

なお Auth0 SDK の Cookie 復号は `hkdf(sha256, AUTH0_SECRET, "", "JWE CEK", 32)` + `jose.jwtDecrypt`（`node_modules/@auth0/nextjs-auth0/dist/server/cookies.js`）であり、SDK 固有の暗号方式ではない。Issue #158 §1 でこの部分を framework 非依存に置き換えても、**ワイヤ上の契約は変わらない**。

## 重大度の定義

| ラベル | 意味                                                             |
| ------ | ---------------------------------------------------------------- |
| 🔴     | 実害のある不正が現在の実装で成立する。優先して直す               |
| 🟡     | 単体では実害に至らないが、防御が欠けている／他の変更で実害化する |
| ⚪     | 設計上の弱さ・運用前提への依存。方針として決めておきたい         |
| ℹ️     | 前提の記録（現状は問題なし。崩れると問題になる）                 |

## 所見一覧

| ID   | 重大度 | 概要                                                                       | 本 PR で対応        |
| ---- | ------ | -------------------------------------------------------------------------- | ------------------- |
| S-1  | 🔴     | email をリクエストボディから受け取り、検証せず永続化している               | ✕（別 Issue）       |
| S-2  | 🟡     | URL の scheme を検証していない（`javascript:` / `data:` を許容）           | ✕（別 Issue）       |
| S-3  | 🟡     | Basic 認証の実装が脆い（未認証で 500 誘発／非定数時間比較／scheme 未検証） | ○                   |
| S-4  | 🟡     | 未処理例外の `message` / `stack` を無加工でログ出力している                | ✕（別 Issue）       |
| S-5  | 🟡     | 依存パッケージに既知脆弱性（hono / uuid / next / Auth0 SDK）               | 一部 ○              |
| S-6  | ⚪     | api-server が公開エンドポイントで、呼び出し元を検証していない              | ✕（方針決め）       |
| S-7  | ⚪     | 使われていない `/api/test` が要認証エンドポイントとして残置                | ✕（別 Issue）       |
| S-8  | ⚪     | レート制限・ブルートフォース対策が無い                                     | ✕（方針決め）       |
| S-9  | ⚪     | `AUTH0_SECRET` を beatfolio と api-server で共有している                   | ✕（#158 §1 の論点） |
| S-10 | ℹ️     | Cookie の `secure` 属性が `APP_BASE_URL` の https 依存                     | －                  |
| S-11 | ℹ️     | accountId 重複エラーが他ユーザーの accountId 存在を示す                    | －                  |

---

## S-1 🔴 email をリクエストボディから受け取り、検証せず永続化している

### 事象

`POST /api/users`（ユーザー作成）と `POST /api/users/me`（メール更新）が、**リクエストボディの `email` をそのまま保存**している。

- `apps/api-server/src/routes/users/post/index.ts:34` — `email: body.email`
- `apps/api-server/src/routes/users/me/post/index.ts:29` — `updateMyEmail(caps, { email: body.email })`

`subId` はセッション由来（`auth0User.sub`）で正しく扱われているが、`email` だけボディ由来になっている。

### 規範との不一致

`docs/architecture/authentication.md` は API 設計として明記している:

> ※ auth0UserId, email はセッションから取得（リクエストボディには含めない）

さらに同ドキュメントの「セキュリティ考慮事項」1 に「**auth0UserId/emailはセッションから取得 / リクエストボディからは受け取らない / なりすまし防止**」とある。**実装がドキュメント（規範）に反している**。

### 影響

認証済みユーザーが、自分のアカウントに**他人の（あるいは存在しない）メールアドレスを登録できる**。

- 現時点では email はプロフィール表示に使われておらず、`GET /api/users/me` で本人にしか返らないため、即時の情報漏洩は無い。
- 実害が出るのは email を**本人性の根拠に使い始めた瞬間**。通知メール送信、サポート窓口での本人確認、メールによるアカウント回復、招待フロー等を実装した時点で、詐称された email が「検証済みの連絡先」として扱われる。
- Auth0 側の `email_verified` も参照していないため、Auth0 で未検証のメールもそのまま通る。

### 推奨対応

1. `email` をリクエストスキーマから外し、セッション（Auth0 の ID トークン / セッションの `user.email`）から取得する。
2. `email_verified` が false のユーザーを弾くか、DB 側で「未検証」を区別できるようにする。
3. `POST /api/users/me`（メール更新）は、Auth0 側のメール変更フローに寄せるか、変更確認メールを伴う独自フローにする。「API を叩けば任意の値に変わる」状態は残さない。

Issue #158 のスコープ（エントリポイントと infrastructure）とは対象レイヤーが異なるため、本 PR には含めず別 Issue とする。ただし §1 で作った `SessionProvider` がセッションから値を取り出す唯一の窓口になるため、対応時は **`AuthSession` に `email` / `emailVerified` を足して同じ経路で取る**形になる（現時点では使わないフィールドを持たせないため `sub` のみ）。

---

## S-2 🟡 URL の scheme を検証していない

### 事象

`imageUrl` / `snsUrl`（プロフィールリンクの url）の検証が `zod` の `.url()` のみ。

- `apps/api-server/src/domain/artistProfiles/valueObjects/imageUrl/index.ts:22`
- `apps/api-server/src/domain/artistProfiles/valueObjects/snsUrl/index.ts:21`

zod v3 の `.url()` は `new URL()` が成功すれば通すため、scheme を制限しない。実行確認:

```text
javascript:alert(1)                    → true
data:text/html,<script>1</script>      → true
vbscript:x                             → true
file:///etc/passwd                     → true
```

保存された値は公開プロフィールに出る:

- `packages/ui/src/design-system/components/organisms/PublicArtistProfile/index.tsx:109` — `href={link.url}`
- 同 `:51` — `src={imageUrl}`

### 影響（現状の評価）

**現時点で stored XSS は成立しない。** React 19.2 は `href` に渡された `javascript:` URL を描画時に無害化する（`react-dom` の `sanitizeURL` が `javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')` に置換）。つまり防御は React に依存して効いている。

ただし次の点で防御として不十分:

1. **防御の所在が UI ライブラリのバージョン**にある。API はデータストアに `javascript:` を受け入れ続ける。React のダウングレード、`dangerouslySetInnerHTML` の導入、SSR で生成する OG メタタグ、メール本文、将来の別クライアント（iOS 等）では同じ値が無害化されない。
2. React が無害化するのは `javascript:` 系のみ。**`<img src>` に任意の外部 URL を入れられる**ことは変わらないため、公開プロフィールの閲覧者の IP / User-Agent / Referer が、プロフィール所有者が指定した任意の第三者サーバーへ送信される（閲覧者の同意なきトラッキング）。

### 推奨対応

VO の検証を `http` / `https` のみ許可に絞る。`imageUrl` は将来的に自前ストレージ or 許可ドメインに限定するのが望ましい。

```typescript
const ALLOWED_PROTOCOLS = ["http:", "https:"];
```

`packages/ui` 側のフォーム検証（`ArtistProfileWizard`）も同じ制約に揃える必要があるが、**信頼境界はサーバー側**なので VO の修正が本体。

---

## S-3 🟡 Basic 認証の実装が脆い

`apps/api-server/src/middlewares/basicAuth/index.ts` に 4 点（引用する行番号は本 PR 適用前 = main 時点の実装）。

### (a) 未認証のまま 500 を誘発できる

```typescript
const authValue = basicAuth.split(" ")[1]; // :31
const [username, password] = Buffer.from(authValue, "base64") // :32
  .toString()
  .split(":");
```

`Authorization: Basic`（スペース・値なし）を送ると `split(" ")[1]` が `undefined` になり、`Buffer.from(undefined, "base64")` が `TypeError` を投げる（実行確認済み）。Next.js の middleware 内の未捕捉例外なので **認証を通過していない任意のクライアントが 500 を発生させられる**。情報漏洩は無いが、認証前に到達できる例外パスは残すべきでない。

### (b) 比較が非定数時間

```typescript
username === process.env.BASIC_AUTH_USERNAME &&
  password === process.env.BASIC_AUTH_PASSWORD;
```

`===` は先頭不一致で早期に返るため、理論上はタイミング差から値を推測できる。ネットワーク越しの実効性は低いが、`crypto.timingSafeEqual` を使うのが定石。

### (c) scheme を検証していない

`Authorization: Bearer <base64("u:p")>` でも認証が通る（実行確認済み）。scheme が `Basic` であることを確認していない。

### (d) パスワードに `:` を含められない

`.split(":")` の結果を 2 要素に分解しているため、`:` を含むパスワードは後半が切り落ちて一致しない。機能バグだが、運用上「強いパスワードが設定できない」形で効く。

### 推奨対応（本 PR で対応）

Issue #158 §2 でこの middleware は Hono へ移植する。その際 **自前実装をやめて `hono/basic-auth` を使う**ことで (a)〜(d) が同時に解消される（`hono/basic-auth` は scheme を検証し、`timingSafeEqual` で比較し、`:` 以降全体をパスワードとして扱う）。`.claude/rules/code-review-checklist.md` §7「ライブラリ API の優先使用」にも沿う。

---

## S-4 🟡 未処理例外の message / stack を無加工でログ出力している

### 事象

`apps/api-server/src/errorMap/index.ts:243-250`

```typescript
const buildUnhandledErrorLog = (error: Error): ErrorLog => ({
  level: "error",
  event: UNHANDLED_ERROR_EVENT,
  fields: {
    errorName: error.name,
    message: error.message,
    stack: error.stack,
  },
});
```

PR #197 でクライアント向け応答から内部詳細を切り離した（応答は `Internal Server Error` 固定）のは正しいが、**ログ側は生の `message` / `stack` を出している**。

### 影響

api-server の未処理例外の主な発生源は DB 層。`postgres.js` / Drizzle の例外メッセージには**失敗したクエリ文が含まれ、状況によってはパラメータ値も載る**。パラメータには email や sub といった PII が入りうる。接続失敗時のメッセージには接続先ホストが載る。

`.claude/rules/code-review-checklist.md` §4-3「機密情報のログマスク」は、PII / Auth0 の sub / トークンをログに出さないことを 🔴 ブロッキングとしている。現状は**その経路が空いている**。

### 推奨対応

- `message` / `stack` をそのまま出さず、既知の例外型（postgres エラー等）は `code` / `constraint` のような安全なフィールドだけ抽出する。
- 生の詳細が必要なら、PII をマスクするシリアライザを `utils/logger` に持たせる。
- 少なくとも「未知の例外は `errorName` + `stack` の先頭 N フレームのみ」に絞る。

---

## S-5 🟡 依存パッケージの既知脆弱性

`npm audit` の結果: critical 3 / high 7 / moderate 10 / low 1（計 21）。大半は dev 依存（vite / vitest / storybook / turbo / esbuild / tar / shell-quote）で本番ランタイムに載らない。**api-server の本番ランタイムに載るもの**は以下。

| パッケージ            | 現在    | 影響範囲          | 修正          | 本 PR での扱い                                   |
| --------------------- | ------- | ----------------- | ------------- | ------------------------------------------------ |
| `hono`                | 4.12.10 | `<= 4.12.33`      | 4.13.x        | **上げる**（`^4.13.1`。beatfolio も同時に）      |
| `uuid`                | 11.1.0  | `< 11.1.1`        | 削除          | **依存自体を削除**（リポジトリ内で未使用だった） |
| `@auth0/nextjs-auth0` | 4.14.0  | `4.12.0 - 4.17.0` | 4.18+         | **依存自体を削除**（#158 §1）                    |
| `next`                | 15.5.14 | 多数              | 要 major 追従 | api-server からは**削除**。beatfolio は別途      |

hono の advisory 群のうち、本リポジトリの使い方に直接関わるもの:

- **`getCookie()` の Cookie 名ハンドリングにおける non-breaking space プレフィックスによるバイパス** — #158 §1 で Cookie を自前で読む実装に入るため、`hono/cookie` を使うなら修正済みバージョンが前提になる。
- **JWT middleware が Bearer 以外の scheme も受け入れる** — 現在 `hono/jwt` は未使用。将来 Bearer 方式へ移行する際に関係する。
- **CORS middleware がワイルドカード既定時に任意 Origin を credentials 付きで反映** — 現在 CORS middleware は未使用。導入時に注意。
- `serveStatic` / `toSSG` / `ipRestriction` / `hono/jsx` 系は未使用のため影響なし。

`next` の advisory には **Middleware / Proxy bypass** 系が複数含まれる。api-server は Basic 認証を Next の Edge Middleware で実装しているため、この系統の脆弱性は**そのまま Basic 認証のバイパス可能性**を意味する。#158 で Basic 認証を Hono middleware（アプリ本体）へ移すことは、この面では純粋な改善になる。

---

## S-6 ⚪ api-server が公開エンドポイントで、呼び出し元を検証していない

api-server は独立した Vercel プロジェクトとして公開 URL を持つ。認証の判断材料は「有効な Auth0 セッション Cookie を提示できるか」だけで、**リクエストが beatfolio（BFF）を経由したかは検証していない**。

本来その層を担うはずの Basic 認証には、構成上の矛盾がある:

- Terraform の `enable_basic_auth` は既定 `"true"`（`apps/api-server/infrastructure/variables.tf`）
- 一方 beatfolio の `createApiServerClient()` は **`cookie` ヘッダのみ転送し `Authorization` を送らない**（`apps/beatfolio/src/utils/client/index.ts`）

したがって api-server 側で Basic 認証が実際に有効なら、**BFF 経由の全リクエストが 401 になる**。動いている以上、api-server の `ENABLE_BASIC_AUTH` は実質 `false` で運用されているはず（tfvars の実値は未確認）。つまり **Basic 認証は api-server では防御として機能していない**。

### 確認したいこと / 方針

- api-server の `ENABLE_BASIC_AUTH` の実値（production / preview）
- api-server を公開したままにするのか、BFF 専用の内部サービスとして扱うのか
- 後者なら、Basic 認証を「BFF も送る共有クレデンシャル」にするか、Vercel の Deployment Protection / OIDC など別の仕組みに寄せるか

ブラウザから api-server ドメインへ直接 `__session` が送られることは無い（Cookie は beatfolio のドメインに紐づく別オリジン）ため、api-server 側の CSRF リスクは低い。問題は「Cookie を入手した攻撃者が BFF を迂回して直接叩ける」点で、これは BFF 側の追加チェック（未登録リダイレクト等）を飛ばせることを意味する。

---

## S-7 ⚪ 使われていない `/api/test` が残置

`apps/api-server/src/routes/test/get/index.ts` は `{ message: "Hello World" }` を返すだけの要認証エンドポイント。情報漏洩は無いが、意味のない攻撃面と運用ノイズ。Issue #158 §8 の動作確認リストにも入っており、**削除するなら本 PR が機会**（ただし Issue が「11 本の確認」を前提にしているため、削除は別途合意したい）。

---

## S-8 ⚪ レート制限・ブルートフォース対策が無い

- Basic 認証への総当たり
- `GET /api/artists/:accountId` による accountId の存在探索
- `POST /api/users` の連投

いずれも制限が無い。公開エンドポイント（`GET /api/artists`）は `limit 100`（`usecases/artistProfiles/listPublicProfiles/index.ts`）で応答サイズが抑えられているのは良い。Vercel の WAF / Rate Limiting か、アプリ層の実装かを方針として決めたい。

---

## S-9 ⚪ AUTH0_SECRET を beatfolio と api-server で共有している

現構成では api-server が Auth0 セッション Cookie を復号するため、`AUTH0_SECRET` を両プロジェクトに同値で配っている（`apps/api-server/infrastructure/variables.tf` の `production_auth0_secret` に「beatfolio 側と同じ値にする必要がある」と明記）。

そのため **どちらか一方の環境変数が漏洩すると、両サービスのセッションを任意に偽造できる**（署名鍵ではなく暗号鍵そのものを持つため、任意の `sub` のセッション Cookie を作れる）。

Issue #158 §1 が挙げる **Bearer JWT（JWKS 検証）方式に移せば、api-server は Auth0 の公開鍵で検証するだけになり共有秘密が不要になる**。これは Bearer 方式を選ぶ最大のセキュリティ的動機であり、Cookie 自前復号方式には無い利点。

本 PR は「Next.js を外す」ことを目的とし、**ワイヤ上の契約を変えない Cookie 自前復号**を採る（Auth0 テナントへの API/audience 登録と beatfolio 側のトークン送出変更を伴わないため）。ただし `SessionProvider` インターフェースの背後に閉じ込め、**Bearer 実装を差し替えられる形**にする。S-9 の解消は後続の段階移行で行う。

---

## S-10 ℹ️ Cookie の secure 属性が APP_BASE_URL の https 依存

Auth0 SDK は `secure` を `AUTH0_COOKIE_SECURE === "true"` で決めるが、`APP_BASE_URL` が `https:` の場合に限り強制的に `true` へ上書きする（`node_modules/@auth0/nextjs-auth0/dist/server/client.js:41-68`）。

本リポジトリは `AUTH0_COOKIE_SECURE` を設定していないため、**`APP_BASE_URL` が https であることだけが `Secure` 属性の根拠**になっている。production / preview では https なので現状は問題ないが、この前提が崩れるとセッション Cookie が平文で流れる。`AUTH0_COOKIE_SECURE=true` を明示するのが安全。

`SameSite` は既定 `lax`。BFF がサーバー間で転送する構成なので機能上の問題はない。

---

## S-11 ℹ️ accountId 重複エラーが他ユーザーの accountId 存在を示す

`errorMap` の `AccountIdAlreadyTakenError` は `clientMessage` に accountId を含める（`Account ID already taken: xxx`）。他ユーザーの accountId の存在を確認できるが、**accountId は公開プロフィールの URL そのもの**（`GET /api/artists/:accountId`）なので実質公開情報であり、追加の漏洩にはならない。「重複しているかを知りたい」という機能要件も満たしているため、現状維持で問題ないと判断する。

---

## 問題が無いことを確認した点

調査して**妥当だったもの**も記録する（再調査のコストを下げるため）。

| 観点                    | 確認内容                                                                                                                                                                                       |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 認可（IDOR）            | 書き込み系は `withWriteCapabilities(deps, auth0User.sub, ...)` を通り、`resolveActor(sub)` が解決した actor の集約しか触れない。リクエストボディから artistId / profileId を受け取る経路が無い |
| 公開クエリのフィルタ    | `findPublishedByAccountId` / `listPublishedSummaries` は `published = true` かつ `deletedAt IS NULL` で絞っている。未公開プロフィールが公開 API から漏れない                                   |
| 取得件数の上限          | 公開一覧は `limit 100`（`MAX_PROFILES`）。無制限取得になっていない                                                                                                                             |
| クライアント向けエラー  | `errorMap` が status / message を固定し、未知の例外は `Internal Server Error` に丸める（PR #197）                                                                                              |
| トランザクション境界    | User と Artist の同時作成が `txRunner.run` で 1 トランザクションに入っている。`RollbackSignal` で業務エラー時もロールバックされる                                                              |
| シークレットの git 追跡 | `git ls-files` で追跡されているのは `.env.example` と `env.tf` のみ。`.env.local` は追跡されていない                                                                                           |
| Terraform の sensitive  | `DATABASE_URL` / `AUTH0_CLIENT_SECRET` / `AUTH0_SECRET` / `BASIC_AUTH_*` が `sensitive_keys` に入っている                                                                                      |
| traceparent の検証      | `parseTraceId` が version / trace-id / parent-id の不正値を弾いている。外部入力をそのままログ相関に使っていない                                                                                |
| accountId の形式        | `^[a-zA-Z0-9_]+$` に制限。パストラバーサルや SQL メタ文字が accountId 経由で入らない                                                                                                           |
| SQL インジェクション    | 全クエリが Drizzle のクエリビルダ経由。ユーザー入力を含む生 SQL は無い                                                                                                                         |

## Issue #158 による変化（セキュリティ観点）

| 変化                                                                | 評価                                                                       |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Basic 認証が Next Edge Middleware → Hono middleware（アプリ本体）へ | **改善**。next の Middleware bypass 系 advisory（S-5）の影響を受けなくなる |
| Basic 認証が自前実装 → `hono/basic-auth`                            | **改善**。S-3 (a)〜(d) が解消                                              |
| `next` / `@auth0/nextjs-auth0` を api-server から削除               | **改善**。S-5 の該当分が消える                                             |
| Auth0 セッション復号が SDK → 自前（jose + hkdf）                    | **中立**。暗号方式は同一。ただし SDK の内部仕様に依存する点は増える        |
| `AUTH0_SECRET` の共有                                               | **変わらず**。S-9 は残る（Bearer 移行時に解消）                            |
| api-server の公開性                                                 | **変わらず**。S-6 は残る                                                   |

## 対応の切り分け

### 本 PR（#158）で対応する

- S-3 — Basic 認証を `hono/basic-auth` で置き換え（§2 の作業そのもの）
- S-5 の一部 — `hono` を `^4.13.1` へ。`uuid` / `next` / `@auth0/nextjs-auth0` は削除（`uuid` はリポジトリ内で未使用だったため上げずに落とす）
- S-9 の緩和準備 — セッション取得を `SessionProvider` インターフェースに閉じ込め、Bearer 実装へ差し替え可能にする

### 別 Issue として起票を推奨する

| ID  | 内容                                                    | 優先度 |
| --- | ------------------------------------------------------- | ------ |
| S-1 | email をセッション由来に変更し、`email_verified` を扱う | 高     |
| S-2 | URL VO の scheme を `http` / `https` に制限             | 中     |
| S-4 | 未処理例外ログの PII マスク                             | 中     |
| S-6 | api-server の公開性と呼び出し元検証の方針決定           | 中     |
| S-8 | レート制限の方針決定                                    | 低     |
| S-7 | `/api/test` の削除                                      | 低     |

### 方針が決まったら昇格させる先

- S-1 の結論 → `docs/architecture/authentication.md`（既に「セッションから取得」と書かれているため、**実装をドキュメントに合わせる**のが筋）
- S-6 / S-9 の結論 → `docs/architecture/authentication.md` および `docs/architecture/infrastructure/README.md`
- S-2 の結論 → `docs/product/profile-information-design.md`（入力可能な URL の定義）
