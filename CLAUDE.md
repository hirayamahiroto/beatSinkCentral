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

### 実装パターン

- **Entity/Value Object**: type + ファクトリ関数パターン
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
├── entities/       # Entity定義 + ファクトリ関数
├── repositories/   # リポジトリインターフェース
└── valueObjects/   # 値オブジェクト（ドメイン内に配置）
    ├── Auth0UserId/
    ├── Email/
    └── Username/

usecases/           # ユースケース（ドメイン外）
```

## アーキテクチャ

詳細は `docs/architecture.md` を参照。
