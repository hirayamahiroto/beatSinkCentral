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

## セッション検証の仕組み

beatfolio と api-server は**別デプロイ**だが、セッションの実体は Auth0 SDK が発行する暗号化 Cookie 1 つで、それを BFF がサーバー間で転送する。

```text
ブラウザ
  │  Cookie: __session（beatfolio のドメインに紐づく）
  ▼
beatfolio（Next.js + @auth0/nextjs-auth0）
  │  cookie ヘッダを api-server へ転送
  ▼
api-server（Hono standalone）
     __session を自前で復号して sub を得る
```

api-server は **Auth0 SDK に依存しない**。Cookie の暗号方式は SDK と同一（`hkdf(sha256, AUTH0_SECRET, "", "JWE CEK", 32)` で鍵を導出し、`dir` + `A256GCM` の JWE を復号）で、`jose` + `@panva/hkdf` だけで実装している。

| 層       | 実装                                             | 責務                                    |
| -------- | ------------------------------------------------ | --------------------------------------- |
| データ   | `infrastructure/auth0/sessionProvider`           | Cookie の再結合・復号・`sub` の取り出し |
| 初期化   | `infrastructure/auth0` の `getSessionProvider()` | `AUTH0_SECRET` の解決（遅延初期化）     |
| エントリ | `middlewares/auth0` の `requireAuthMiddleware`   | Cookie の受け渡しと 401 の確定          |

`SessionProvider` インターフェースを挟んでいるため、検証方式（Cookie 復号 / Bearer JWT 等）を差し替えても middleware とルートは変わらない。

### 制約と将来の移行

- **`AUTH0_SECRET` を beatfolio と api-server で共有する必要がある**（同じ Cookie を両者が復号するため）。片方の環境変数が漏れると両サービスのセッションを偽造できる。
- 将来 **Bearer JWT（Auth0 の JWKS で検証）** に移すと、api-server は公開鍵で検証するだけになり共有秘密が不要になる。移行には Auth0 側の API（audience）登録と beatfolio 側のトークン送出変更が必要なため、フロントと合わせた段階移行とする。
- Cookie の形式は Auth0 SDK の内部仕様に依存する。SDK のメジャー更新時は `sessionProvider` の定数（Cookie 名・チャンク区切り・鍵導出パラメータ）を確認する。鍵導出は固定値テストで担保している。

## ミドルウェア構成

```
requireAuthMiddleware
├── Auth0セッションCookieの復号・検証
└── auth0Userをコンテキストに設定

requireVerifiedMiddleware（オプション）
├── email_verifiedのチェック
└── 未検証の場合は403

requireRegisteredMiddleware（新規追加予定）
├── DBにUserが存在するか確認
└── 未登録の場合はリダイレクトまたは403
```

## セキュリティ考慮事項

1. **auth0UserId/emailはセッションから取得**
   - リクエストボディからは受け取らない
   - なりすまし防止
   - ⚠️ **現在の実装はこの規範に違反している**。`POST /api/users` と `POST /api/users/me` が `email` をリクエストボディから受け取っている。詳細と対応方針は [api-server セキュリティ調査](../discussions/api-server-security-review.md) の S-1 を参照（本ドキュメントが規範であり、実装を合わせる）

2. **email_verified チェック**
   - 必要に応じて `requireVerifiedMiddleware` を適用
   - 未検証ユーザーの機能制限

3. **登録状態チェック**
   - 登録必須の機能には `requireRegisteredMiddleware` を適用
