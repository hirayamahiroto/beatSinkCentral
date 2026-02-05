# CLAUDE.md

このファイルはClaude Codeがこのリポジトリで作業する際のガイダンスを提供します。

## プロジェクト概要

beatSinkCentralは音楽関連サービスのモノレポです。

## よく使うコマンド

```bash
# 開発サーバー起動
npm run dev

# テスト実行
npm test -- --filter api-server

# 特定ディレクトリのテスト
npm test -- --filter api-server -- --run src/domain/users

# ビルド
npm run build
```

## テスト方針

### 基本方針

純粋関数での実装を採用しているため、**関数単位でのIOテスト**を基本とする。

```
入力 → 関数 → 出力
```

### アサーションルール

オブジェクトや配列の検証には `toStrictEqual` を使用する。

```typescript
// Good: toStrictEqual（厳密な比較）
expect(user.attributes).toStrictEqual({ role: "admin" });
expect(user.createdAt).toStrictEqual(new Date("2024-01-01T00:00:00.000Z"));

// Bad: toEqual（緩い比較）
expect(user.attributes).toEqual({ role: "admin" });
```

- `toStrictEqual`: 型とプロパティを厳密に比較（推奨）
- `toBe`: プリミティブ値の比較に使用

### 層ごとのテスト責務

```
Value Objects
├── バリデーション詳細をテスト
├── 有効な値 → 正常にオブジェクト生成
├── 無効な値 → 適切なエラーをスロー


Entity
├── IO確認（入力パラメータ → 出力Entity）
├── デフォルト値の確認
└── 値オブジェクト呼び出し確認（spy）
    ※バリデーション詳細は値オブジェクト側でテスト済み
```

### 値オブジェクトのテスト例

```typescript
describe("Username", () => {
  it("有効なユーザー名を返す", () => {
    expect(createUsername("testuser").value).toBe("testuser");
  });

  it("無効なユーザー名でエラー", () => {
    expect(() => createUsername("")).toThrow("username is required");
    expect(() => createUsername("a".repeat(256))).toThrow(
      "username must be 255 characters or less"
    );
  });
});
```

### Entityのテスト例

```typescript
describe("User Entity", () => {
  // IO確認
  it("有効なパラメータでUserを作成できる", () => {
    const user = createUser({
      auth0UserId: "auth0|123",
      email: "test@example.com",
      username: "testuser",
    });

    expect(user.auth0UserId).toBe("auth0|123");
    expect(user.email).toBe("test@example.com");
    expect(user.username).toBe("testuser");
  });

  // 値オブジェクト呼び出し確認
  it("各値オブジェクトの生成関数が呼び出される", () => {
    const createAuth0UserIdSpy = vi.spyOn(Auth0UserIdModule, "createAuth0UserId");
    const createEmailSpy = vi.spyOn(EmailModule, "createEmail");
    const createUsernameSpy = vi.spyOn(UsernameModule, "createUsername");

    createUser({ ... });

    expect(createAuth0UserIdSpy).toHaveBeenCalledWith("auth0|123");
    expect(createEmailSpy).toHaveBeenCalledWith("test@example.com");
    expect(createUsernameSpy).toHaveBeenCalledWith("testuser");
  });
});
```

### テストしないこと（Entity層）

- 値オブジェクトのバリデーション詳細（各値オブジェクトでテスト済み）
- エラーメッセージの内容確認（値オブジェクト側の責務）

### 時間依存のテスト

`createdAt`/`updatedAt`など時間に依存するテストは、vitestのFake Timersを使用する。

```typescript
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
});
```

## コーディング規約

### ファイル配置ルール

実装ファイルは `{FuncName}/index.ts` の形式で配置する。

```
# Good
userRepository/
├── index.ts        # 実装
└── index.test.ts   # テスト

email/
├── index.ts        # 実装
└── index.test.ts   # テスト

# Bad
UserRepository.ts   # ディレクトリにしない
Email.ts
```

### 実装パターン

- **Entity/Value Object/Repository**: type + ファクトリ関数パターン
- **class不使用**: 純粋関数で実装し、テスタビリティを向上

```typescript
// 型定義
export interface Username {
  readonly value: string;
}

// ファクトリ関数
export const createUsername = (value: string): Username => {
  // バリデーション
  return { value };
};
```

### ディレクトリ構造

```
domain/{object}/
├── entities/           # Entity定義 + ファクトリ関数
│   ├── index.ts
│   └── index.test.ts
├── repositories/       # リポジトリインターフェース
│   └── index.ts
└── valueObjects/       # 値オブジェクト（ドメイン内に配置）
    ├── auth0UserId/
    │   ├── index.ts
    │   └── index.test.ts
    ├── email/
    │   ├── index.ts
    │   └── index.test.ts
    └── userName/
        ├── index.ts
        └── index.test.ts

infrastructure/
└── repositories/
    └── userRepository/
        ├── index.ts
        └── index.test.ts

usecases/               # ユースケース（ドメイン外）
└── users/
    └── index.ts
```

## 外部クライアントの実装パターン（Next.js）

### 背景

Next.jsはビルド時にモジュールのトップレベルを評価する。そのため、環境変数に依存するクライアント（Database、Auth0、Redis等）をトップレベルで初期化すると、CI/CD環境でビルドエラーが発生する。

```
ビルド時: 環境変数が存在しない → エラー
実行時:   環境変数が存在する   → 正常動作
```

APIルートのコードはビルド時には実行されないため、クライアントの初期化もビルド時には不要。実際に使用されるタイミング（API実行時）で初期化すべき。

### 遅延初期化パターン（必須）

環境変数に依存するクライアントは、以下のクロージャベースの遅延初期化パターンで実装する。

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

**ポイント**: クロージャを使用することで、状態変数（`db`）がモジュールスコープに露出せず、外部から誤って参照・変更されることを防ぐ。

### なぜこのパターンか

| 実装方法 | ビルド時 | 実行時 |
|---------|---------|--------|
| トップレベル初期化 | 即座に評価される → エラー | 正常 |
| 遅延初期化（関数内） | 関数定義のみ → エラーなし | 呼び出し時に初期化 → 正常 |

### 適用が必要なクライアント

- Database（PostgreSQL、MySQL等）
- Auth0 / 認証サービス
- Redis / キャッシュサービス
- S3 / ストレージサービス
- Stripe / 決済サービス
- その他、環境変数でAPIキー・接続情報を設定するもの

### 参考

- [Next.js GitHub Discussion #38164](https://github.com/vercel/next.js/discussions/38164)
- [Prisma: Best practice for instantiating PrismaClient with Next.js](https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices)

## アーキテクチャ

詳細は `docs/architecture.md` を参照。
