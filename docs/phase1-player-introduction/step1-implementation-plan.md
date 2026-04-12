# Step 1: ユーザー登録フロー完成 + DB連携

## Context

Phase 1「プレイヤー紹介」の最初のステップ。現状はすべてのルートでAuth0認証が必須になっており、Top Pageにすらログインなしではアクセスできない。また、オンボーディングフォームとAPIの間にデータ不整合がある（フォームは username+accountId を送るが、APIは email のみ受け付ける）。

**ゴール**: Top Pageを公開し、ユーザー登録フロー（Auth0 → オンボーディング → DB保存 → ダッシュボード）を完成させる。

## 実装方針

ミニマムで段階的に進める。Artist Profile の詳細登録は今回のスコープ外（TBD）。

---

## Phase 1: Top Page を公開 + ヘッダーにログインボタン

### 1-1. beatfolio ミドルウェアの認証方針を反転

**File**: `apps/beatfolio/src/middleware.ts`

- デフォルト公開に変更（現状: 全ルートで認証必須）
- 認証が必要なルートのみ `requireAuthMiddleware` を適用:
  - `/onboarding/*` — ユーザー登録フロー
  - `/dashboard/*` — 登録済みユーザーのページ
  - `/api/*` — BFF API（認証が必要なエンドポイント）
- それ以外（`/`, `/players`, `/event` 等）は認証不要

### 1-2. Top Page からリダイレクト削除 + ヘッダー追加

**File**: `apps/beatfolio/src/app/page.tsx`

- `redirect("/auth/login")` を削除
- `auth0.getSession()` は残す（セッション有無で表示切替）
- ヘッダーに条件分岐: 未ログイン→「ログイン」ボタン、ログイン済→「ダッシュボード」ボタン

---

## Phase 2: Backend - `GET /api/users/me` 実装

### 2-1. UserRepository に findBySub メソッド追加

**File**: `apps/api-server/src/domain/users/repositories/index.ts`

- `findBySub(sub: string): Promise<{ id: string; email: string } | null>` を追加

**File**: `apps/api-server/src/infrastructure/repositories/userRepository/index.ts`

- `findBySub` 実装: users テーブルから sub で検索、id + email を返す

### 2-2. ArtistRepository 新規作成

**File**: `apps/api-server/src/domain/artists/repositories/index.ts` (新規)

- `IArtistRepository` インターフェース:
  - `saveWithOwner(accountId: string, userId: string): Promise<string>` — artist + artist_owner を1トランザクションで作成
  - `findByUserId(userId: string): Promise<{ artistId: string; accountId: string } | null>`
  - `hasProfile(artistId: string): Promise<boolean>`

**File**: `apps/api-server/src/infrastructure/repositories/artistRepository/index.ts` (新規)

- Drizzle ORM で実装、`db.transaction()` 使用

### 2-3. DI Container に artistRepository 追加

**File**: `apps/api-server/src/infrastructure/container/index.ts`

- `artistRepository` を Container に追加

### 2-4. getMe ユースケース作成

**File**: `apps/api-server/src/usecases/users/getMe/index.ts` (新規)

- 入力: `sub` (Auth0のsubject)
- ロジック:
  1. `userRepository.findBySub(sub)` → null なら `{ registered: false }`
  2. `artistRepository.findByUserId(userId)` → artist情報取得
  3. `artistRepository.hasProfile(artistId)` → プロフィール有無
- 出力:
  ```ts
  | { registered: false }
  | { registered: true; userId: string; email: string; artist: { id: string; accountId: string; hasProfile: boolean } }
  ```

### 2-5. `GET /api/users/me` エンドポイント

**File**: `apps/api-server/src/app/api/[[...route]]/users/me/index.ts` (新規)

- Hono GET route、`auth0User.sub` から getMe 呼び出し

**File**: `apps/api-server/src/app/api/[[...route]]/route.ts`

- `/users/me` ルート追加

---

## Phase 3: Backend - ユーザー登録に artist 作成を追加

### 3-1. AccountId Value Object 作成

**File**: `apps/api-server/src/domain/artists/valueObjects/accountId/index.ts` (新規)

- バリデーション: 非空、英数字+アンダースコア、1-255文字

### 3-2. createUser ユースケース拡張

**File**: `apps/api-server/src/usecases/users/index.ts`

- 入力に `accountId` 追加
- User 作成後、Artist + ArtistOwner も作成（`artistRepository.saveWithOwner`）
- 冪等性維持: 既存ユーザーの場合は既存の artistId も返す
- 出力: `{ userId: string; artistId: string }`

### 3-3. `POST /api/users/create` スキーマ更新

**File**: `apps/api-server/src/app/api/[[...route]]/users/create/index.ts`

- リクエストスキーマに `accountId` 追加

---

## Phase 4: BFF レイヤー更新

### 4-1. BFF に `/api/users/me` プロキシ追加

**File**: `apps/beatfolio/src/app/api/[[...route]]/users/me/index.ts` (新規)

- api-server の `/api/users/me` にプロキシ

### 4-2. BFF ユーザー作成エンドポイント更新

**File**: `apps/beatfolio/src/app/api/[[...route]]/users/create/index.ts`

- リクエストスキーマに `accountId` 追加、api-server に転送

### 4-3. BFF ルート更新

**File**: `apps/beatfolio/src/app/api/[[...route]]/route.ts`

- `/users/me` ルート追加

---

## Phase 5: Frontend - オンボーディング修正 + ダッシュボード

### 5-1. オンボーディングページ修正

**File**: `apps/beatfolio/src/app/onboarding/page.tsx`

- `email` をセッションから取得して ProfileForm に props で渡す
- 登録済みユーザーなら `/dashboard` にリダイレクト

### 5-2. ProfileForm 修正

**File**: `apps/beatfolio/src/app/onboarding/ProfileForm.tsx`

- `username` フィールドを削除（usernameは当面不要）
- `email` を props で受け取る
- POST 先を `/api/users/create` に変更、`{ email, accountId }` を送信
- 成功時 `/dashboard` にリダイレクト

### 5-3. ダッシュボードページ新規作成

**File**: `apps/beatfolio/src/app/dashboard/page.tsx` (新規)

- Server Component
- `auth0.getSession()` でセッション確認 → なければ `/auth/login` へ
- `/api/users/me` を呼び出し
  - `registered: false` → `/onboarding` へリダイレクト
  - `registered: true, hasProfile: false` → プロフィール登録を促すメッセージ表示
  - `registered: true, hasProfile: true` → 基本情報表示

---

## ファイル変更サマリ

| ファイル                                                                    | 操作 | 内容                           |
| --------------------------------------------------------------------------- | ---- | ------------------------------ |
| `apps/beatfolio/src/middleware.ts`                                          | 修正 | `/` を認証から除外             |
| `apps/beatfolio/src/app/page.tsx`                                           | 修正 | リダイレクト削除、ヘッダー追加 |
| `apps/api-server/src/domain/users/repositories/index.ts`                    | 修正 | `findBySub` 追加               |
| `apps/api-server/src/infrastructure/repositories/userRepository/index.ts`   | 修正 | `findBySub` 実装               |
| `apps/api-server/src/domain/artists/repositories/index.ts`                  | 新規 | IArtistRepository              |
| `apps/api-server/src/domain/artists/valueObjects/accountId/index.ts`        | 新規 | AccountId VO                   |
| `apps/api-server/src/infrastructure/repositories/artistRepository/index.ts` | 新規 | ArtistRepository 実装          |
| `apps/api-server/src/infrastructure/container/index.ts`                     | 修正 | artistRepository 追加          |
| `apps/api-server/src/usecases/users/getMe/index.ts`                         | 新規 | getMe ユースケース             |
| `apps/api-server/src/usecases/users/index.ts`                               | 修正 | accountId 対応                 |
| `apps/api-server/src/app/api/[[...route]]/users/me/index.ts`                | 新規 | GET /api/users/me              |
| `apps/api-server/src/app/api/[[...route]]/users/create/index.ts`            | 修正 | accountId 追加                 |
| `apps/api-server/src/app/api/[[...route]]/route.ts`                         | 修正 | me ルート追加                  |
| `apps/beatfolio/src/app/api/[[...route]]/users/me/index.ts`                 | 新規 | BFF プロキシ                   |
| `apps/beatfolio/src/app/api/[[...route]]/users/create/index.ts`             | 修正 | accountId 転送                 |
| `apps/beatfolio/src/app/api/[[...route]]/route.ts`                          | 修正 | me ルート追加                  |
| `apps/beatfolio/src/app/onboarding/page.tsx`                                | 修正 | email props、リダイレクト      |
| `apps/beatfolio/src/app/onboarding/ProfileForm.tsx`                         | 修正 | username削除、email props      |
| `apps/beatfolio/src/app/dashboard/page.tsx`                                 | 新規 | ダッシュボード                 |

## 検証方法

1. `npm run build` が通ること
2. `npm test -- --filter api-server` でテスト通過
3. 手動確認:
   - `/` にログインなしでアクセスできること
   - ヘッダーに「ログイン」ボタンが表示されること
   - ログイン後 → `/dashboard` → 未登録なら `/onboarding` にリダイレクト
   - オンボーディングで accountId 入力 → DB に user + artist + artist_owner が作成
   - 登録済みでダッシュボードにアクセス → プロフィール登録を促すメッセージ
