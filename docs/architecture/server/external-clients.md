# 外部クライアントの実装パターン

環境変数に依存する外部クライアント（Database / Auth0 / Redis / S3 / Stripe 等）を安全に初期化するためのパターンを定義する。ランタイム非依存の規範であり、api-server（Hono）・beatfolio（Next.js）の双方に適用する。

## 背景

モジュールのトップレベルは、**そのコードが実際に必要になる前に評価される**場面がある。

| 場面                     | 環境変数             | トップレベル初期化の結果 |
| ------------------------ | -------------------- | ------------------------ |
| CI/CD のビルド・バンドル | 存在しないことが多い | エラーで落ちる           |
| 単体テスト（Vitest）     | 設定していない       | import した時点で落ちる  |
| 本番の実行時             | 存在する             | 正常動作                 |

環境変数に依存するクライアントをトップレベルで初期化すると、**そのモジュールを import しただけで**（＝実際にクライアントを使わない経路でも）失敗する。クライアントの初期化は、**実際に使用されるタイミングで行うべき**。

## 採用パターン：クロージャベースの遅延初期化（必須）

```typescript
// infrastructure/database/index.ts
import { createDatabaseClient, DatabaseClient } from "...";

export const getDb = (() => {
  let db: DatabaseClient | null = null;

  return (): DatabaseClient => {
    if (!db) {
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new Error("DATABASE_URL is not defined");
      }
      db = createDatabaseClient(databaseUrl);
    }
    return db;
  };
})();
```

**ポイント**: クロージャで状態変数（`db`）を閉じ込めることで、モジュールスコープに露出させず、外部からの誤参照・誤変更を防ぐ。

## なぜこのパターンか

| 実装方法             | import 時                 | 実行時                    |
| -------------------- | ------------------------- | ------------------------- |
| トップレベル初期化   | 即座に評価される → エラー | 正常                      |
| 遅延初期化（関数内） | 関数定義のみ → エラーなし | 呼び出し時に初期化 → 正常 |

## 適用が必要なクライアント

環境変数で API キー・接続情報を設定するもの全般。具体例：

- Database（PostgreSQL / MySQL 等） — `infrastructure/database` の `getDb()`
- Auth0 / 認証サービス — `infrastructure/auth0` の `getSessionProvider()`
- Redis / キャッシュサービス
- S3 / ストレージサービス
- Stripe / 決済サービス

## 呼び出し側の作法：解決を遅延させる

遅延初期化した getter を、**モジュールのトップレベルで呼んではいけない**。呼んだ時点で初期化が走り、遅延の意味が消える。middleware などに注入する場合は「解決済みの値」ではなく「解決する関数」を渡す。

```typescript
// NG: import 時に getSessionProvider() が走る
export const requireAuthMiddleware =
  createRequireAuthMiddleware(getSessionProvider());

// OK: 関数を渡し、リクエスト時に解決させる
export const requireAuthMiddleware =
  createRequireAuthMiddleware(getSessionProvider);
```

## 参考

- [Next.js GitHub Discussion #38164](https://github.com/vercel/next.js/discussions/38164) — beatfolio（Next.js）側で最初にこの制約に当たった経緯
- [Prisma: Best practice for instantiating PrismaClient with Next.js](https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices)
