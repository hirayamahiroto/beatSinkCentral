# 認証・ユーザー登録設計

## 概要

本アプリケーションでは、Auth0による認証とアプリケーション内のユーザー登録を分離して管理する。

## 基本方針

- **Auth0**: 認証（誰であるか）を管理
- **DB User**: アプリケーションのユーザー登録状態を管理

この分離により、signup後に離脱したユーザーのゴミデータがDBに残らない。

## ユーザー状態

| 状態             | Auth0 | DB  | 説明                            |
| ---------------- | ----- | --- | ------------------------------- |
| 未認証           | ×     | ×   | ログインしていない              |
| 認証済み・未登録 | ○     | ×   | Auth0でsignup済み、アプリ未登録 |
| 登録済み         | ○     | ○   | アプリのユーザーとして有効      |

```
┌─────────────────────────────────────────────────────┐
│  状態: 認証済み・未登録                               │
│                                                     │
│  Auth0: signup完了                                  │
│  DB: Userレコードなし                                │
│                                                     │
│  → ログイン可能だが、機能は制限される                  │
│  → プロフィール作成画面へ誘導                         │
└─────────────────────────────────────────────────────┘
                      │
                      │ プロフィール作成（username等入力）
                      ▼
┌─────────────────────────────────────────────────────┐
│  状態: 登録済み                                      │
│                                                     │
│  Auth0: signup完了                                  │
│  DB: Userレコードあり                                │
│                                                     │
│  → 全機能が利用可能                                  │
└─────────────────────────────────────────────────────┘
```

## ユーザー登録フロー

```
1. Auth0 signup
   ├── Auth0にユーザー作成
   └── アプリにリダイレクト

2. 初回ログイン検知
   ├── Auth0セッションからsub（Auth0 ID）取得
   ├── DBにUserが存在するか確認
   └── 存在しない → プロフィール作成画面へリダイレクト

3. プロフィール作成
   ├── ユーザーがusername等を入力
   ├── POST /api/users でUser作成
   └── DBにUserレコード保存

4. 登録完了
   └── 通常のアプリ利用開始
```

## API設計

### ユーザー作成 API

```
POST /api/users

Request:
- username: string（必須）
- attributes: object（オプション）

※ auth0UserId, email はセッションから取得（リクエストボディには含めない）

Response:
- user: { auth0UserId, email, username }
- isNewUser: boolean
```

### 認証状態の確認

```typescript
// ミドルウェアでの判定例
const auth0User = c.get("auth0User"); // Auth0セッションから取得
const user = await userRepository.findByAuth0UserId(auth0User.sub);

if (!user) {
  // 認証済み・未登録 → プロフィール作成へ
  return redirect("/onboarding");
}

// 登録済み → 通常処理
```

## レイヤー別の責務

### BFF (beatfolio)

- Auth0セッションの管理
- ログイン/ログアウト処理
- 未登録ユーザーのリダイレクト制御
- api-serverへのリクエスト転送

### api-server

- ユーザー登録状態の確認（DBアクセス）
- ユーザー作成・更新処理
- ビジネスロジックの実行

## ミドルウェア構成

beatfolio の認証境界は `apps/beatfolio/src/middleware.ts` の 1 箇所。Hono のチェーンとして合成し、`page.tsx` には認証判定を書かない。

```text
src/middleware.ts（Next.js middleware = Hono app）
├── basicAuthMiddleware        /auth/* と /api/* を除く全パス（ENABLE_BASIC_AUTH 時のみ）
├── requireAuthMiddleware      Auth0 の middleware を実行
│     ├── /auth/* または Auth0 がリダイレクト等を返した → その応答を返してチェーン終了
│     └── 素通し応答（200）→ authResponse としてコンテキストに保持し next()
├── requireSessionMiddleware   SESSION_REQUIRED_PATHS（/dashboard/* /onboarding/*）のみ
│     └── セッション無し → /auth/login へ redirect
└── 終端ハンドラ               authResponse（Auth0 が付けた Set-Cookie 等）を返す
```

- **`requireAuthMiddleware` は `next()` を呼ぶ**。Auth0 の素通し応答を即 return するとチェーンがそこで終わり、後続の `requireSessionMiddleware` が実行されない（過去にこの形で guard が無効化されていた。`middleware.test.ts` で合成を担保する）。
- 保護パスを増やすときは `SESSION_REQUIRED_PATHS` に足し、`middleware.test.ts` のケースを追加する。
- 未登録ユーザーの `/onboarding` への誘導は認証ではなくデータ由来の遷移なので、middleware ではなく BFF read route の結果を見て `page.tsx` が `redirect` する（[`frontend/bff/design.md`](./frontend/bff/design.md)）。

## アプリのベース URL（appBaseUrl）の決定

Auth0 の `redirect_uri` と、beatfolio が自分自身の BFF を呼ぶ際のベース URL は、両アプリとも同じ優先順位で決定する。
実装は `apps/api-server/src/infrastructure/appBaseUrl` / `apps/beatfolio/src/utils/config/appBaseUrl`。

| 優先 | 出所                | 用途                                                     |
| ---- | ------------------- | -------------------------------------------------------- |
| 1    | `APP_BASE_URL`      | Production の固定ドメイン。末尾スラッシュは除去する      |
| 2    | `VERCEL_BRANCH_URL` | Preview。ブランチ単位で安定する URL（Vercel が自動注入） |
| 3    | `VERCEL_URL`        | Preview。デプロイ単位の URL（Vercel が自動注入）         |
| 4    | localhost           | ローカル開発（beatfolio: 3000 / api-server: 3001）       |

### 環境ごとの設定

- **Production**: Terraform で `APP_BASE_URL` を固定値で配る
- **Preview**: `APP_BASE_URL` を**設定しない**。Vercel が注入する URL から自動で組み立てる。
  `https://beat-sink-central-*-....vercel.app` のようなワイルドカード入り文字列を `APP_BASE_URL` に置くと、
  その文字列がそのまま `redirect_uri` になり、ログイン後に存在しないホストへ飛ぶ（`DNS_PROBE_FINISHED_NXDOMAIN`）
- **Local**: `.env.local` に明示するか、未設定で localhost にフォールバックさせる

### Auth0 側の許可リスト

**Preview と Production は別々の Auth0 Application を使う。** ワイルドカードを登録した Application は
`*.vercel.app` のどのサブドメインでも `redirect_uri` として受け付けるため、Production を同じ Application で
運用すると、第三者が作った Preview デプロイへ Production の認証結果を渡せてしまう。
Terraform の `preview_auth0_client_id` / `production_auth0_client_id` には、**異なる Application の値**を入れる。

Preview 用 Application — デプロイごとに URL が変わるため、ワイルドカードで登録する。

- Allowed Callback URLs: `https://*.vercel.app/auth/callback`
- Allowed Logout URLs: `https://*.vercel.app`
- Allowed Web Origins（サイレント認証を使う場合のみ）: `https://*.vercel.app`

Production 用 Application — ワイルドカードは登録せず、固定ドメインだけを列挙する。

- Allowed Callback URLs: `https://beatfolio.example.com/auth/callback`
- Allowed Logout URLs: `https://beatfolio.example.com`
- Allowed Web Origins（サイレント認証を使う場合のみ）: `https://beatfolio.example.com`

## セキュリティ考慮事項

1. **auth0UserId/emailはセッションから取得**
   - リクエストボディからは受け取らない
   - なりすまし防止

2. **email_verified チェック**
   - 必要に応じて `requireVerifiedMiddleware` を適用
   - 未検証ユーザーの機能制限

3. **登録状態チェック**
   - 登録必須の機能には `requireRegisteredMiddleware` を適用
