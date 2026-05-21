# 外部クライアントの実装パターン（Next.js）

環境変数に依存する外部クライアント（Database / Auth0 / Redis / S3 / Stripe 等）を、Next.js 環境で安全に初期化するためのパターンを定義する。

## 背景

Next.js はビルド時にモジュールのトップレベルを評価する。環境変数に依存するクライアントをトップレベルで初期化すると、CI/CD 環境（環境変数が存在しないビルド時）でビルドエラーが発生する。

```
ビルド時: 環境変数が存在しない → エラー
実行時:   環境変数が存在する   → 正常動作
```

API ルートのコードはビルド時には実行されない。クライアントの初期化もビルド時には不要であり、**実際に使用されるタイミング（API 実行時）で初期化すべき**。

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

| 実装方法             | ビルド時                  | 実行時                    |
| -------------------- | ------------------------- | ------------------------- |
| トップレベル初期化   | 即座に評価される → エラー | 正常                      |
| 遅延初期化（関数内） | 関数定義のみ → エラーなし | 呼び出し時に初期化 → 正常 |

## 適用が必要なクライアント

環境変数で API キー・接続情報を設定するもの全般。具体例：

- Database（PostgreSQL / MySQL 等）
- Auth0 / 認証サービス
- Redis / キャッシュサービス
- S3 / ストレージサービス
- Stripe / 決済サービス

## 参考

- [Next.js GitHub Discussion #38164](https://github.com/vercel/next.js/discussions/38164)
- [Prisma: Best practice for instantiating PrismaClient with Next.js](https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices)
