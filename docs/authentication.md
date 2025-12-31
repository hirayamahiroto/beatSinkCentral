# 認証・ユーザー登録設計

## 概要

本アプリケーションでは、Auth0による認証とアプリケーション内のユーザー登録を分離して管理する。

## 基本方針

- **Auth0**: 認証（誰であるか）を管理
- **DB User**: アプリケーションのユーザー登録状態を管理

この分離により、signup後に離脱したユーザーのゴミデータがDBに残らない。

## ユーザー状態

| 状態 | Auth0 | DB | 説明 |
|------|-------|-----|------|
| 未認証 | × | × | ログインしていない |
| 認証済み・未登録 | ○ | × | Auth0でsignup済み、アプリ未登録 |
| 登録済み | ○ | ○ | アプリのユーザーとして有効 |

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
const auth0User = c.get("auth0User");  // Auth0セッションから取得
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

```
requireAuthMiddleware
├── Auth0セッションの検証
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

2. **email_verified チェック**
   - 必要に応じて `requireVerifiedMiddleware` を適用
   - 未検証ユーザーの機能制限

3. **登録状態チェック**
   - 登録必須の機能には `requireRegisteredMiddleware` を適用
