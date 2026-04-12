# Step 1 - createUser に Artist 作成を統合する

> ブランチ: `feature/step1-create-user-with-artist`

## このブランチの目的

> **複数のEntityにまたがる業務操作（ユーザー登録 = User + Artist + ArtistOwner の同時生成）を、Domain Service という概念で表現し、永続化責務（Repository）から分離した設計を導入する。**

ロードマップ上の位置づけ:

- `docs/phase1-player-introduction/roadmap.md` Phase 1 / Step 1 の Phase 3（ユーザー登録に artist 作成を追加）に相当
- 前のPR (`feature/step1-top-page-and-getme-api`) で整備した getMe API・エラーハンドリング基盤の上に積む

## 解決したい課題

| 課題                                             | 解決方法                                                                                                                            |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| **複数Entity間の整合性をどこで保証するか**       | Domain Service が「常に3つを揃えて返す」純粋関数として表現する。利用側はバラバラに作れない                                          |
| **業務ルールがUsecaseに散らばる**                | 「新規登録時は User + Artist + Owner を作る」という業務ルールを Domain Service に集約。Usecase は永続化とトランザクションだけを担う |
| **Repository が業務ルールを知ってしまう**        | 集約を跨ぐ操作（saveWithOwner 等）を Repository から排除し、各 Repository は単一Entityの永続化のみを担う                            |
| **トランザクション境界とドメインロジックの混在** | Domain Service は純粋関数（副作用なし）、Usecase が `TransactionRunner` でトランザクション境界を張る                                |

## 設計の前提となる原則

このブランチの実装は `docs/server-architecture/architecture.md` の「設計原則: Functional Core, Imperative Shell」セクションに準拠する。要点:

- **データ** = Entity / Value Object
- **変換** = 純粋関数（Factory, Domain Service）
- **副作用** = Repository, トランザクション, エントリポイント

純粋な中核（Functional Core）と命令的な外殻（Imperative Shell）を一方向の依存で繋ぐ。

## このブランチで導入する具体的な手段

### 1. Domain Service（`domain/services/userRegistration`）

```typescript
export const registerNewUser = (input: {
  subId: string;
  email: string;
  accountId: string;
}): {
  user: User;
  artist: Artist;
  owner: ArtistOwner;
} => {
  const user = createUser({ subId: input.subId, email: input.email });
  const artist = createArtist({ accountId: input.accountId });
  const owner = createArtistOwner({
    userId: user.getId(),
    artistId: artist.getArtistId(),
  });
  return { user, artist, owner };
};
```

- 入力: 生の値（subId, email, accountId）
- 出力: User + Artist + ArtistOwner の Entity 群
- 副作用なし、純粋関数
- Repository / DB / トランザクションを一切知らない

### 2. TransactionRunner 抽象（`infrastructure/transaction`）

```typescript
export interface ITransactionRunner {
  run<T>(fn: (tx: TransactionContext) => Promise<T>): Promise<T>;
}
```

- Usecase が「トランザクションを開く」という操作を抽象として扱える
- drizzle 等の具体実装は infrastructure に閉じる
- ドメイン層は依存しない

### 3. Repository の単一責任化

| Repository                    | 責務                     |
| ----------------------------- | ------------------------ |
| `IUserRepository.save`        | User 単一の永続化        |
| `IArtistRepository.save`      | Artist 単一の永続化      |
| `IArtistOwnerRepository.save` | ArtistOwner 単一の永続化 |

- 各 Repository は単一 Entity の CRUD のみ
- `tx?: TransactionContext` を任意引数として受け取り、呼び出し側が境界を制御
- `saveWithOwner` 等の集約跨ぎメソッドは廃止

### 4. ArtistOwner ドメインの新設

`domain/artistOwners/` に entities / behaviors / factories / repositories をフルセット配置。User と Artist の関係を独立したドメイン概念として扱う。

```
domain/artistOwners/
├── entities/    # ArtistOwner type
├── behaviors/   # createArtistOwnerBehaviors
├── factories/   # createArtistOwner / reconstructArtistOwner
└── repositories/ # IArtistOwnerRepository
```

### 5. createUserUseCase のリファクタ

```typescript
export const createUserUseCase = async (input, deps) => {
  // 業務上の前提チェック
  const existingUser = await deps.userRepository.findBySub(input.subId);
  if (existingUser) throw createUserAlreadyRegisteredError(input.subId);

  // ドメインサービスで「作るべきもの」を組み立てる（純粋、副作用なし）
  const { user, artist, owner } = registerNewUser(input);

  // トランザクション境界を張って永続化
  return await deps.txRunner.run(async (tx) => {
    await deps.userRepository.save(user.toPersistence(), tx);
    await deps.artistRepository.save(artist.toPersistence(), tx);
    await deps.artistOwnerRepository.save(owner.toPersistence(), tx);
    return {
      userId: user.getId(),
      artistId: artist.getArtistId(),
    };
  });
};
```

## 役割分担（このフローで担当していること）

| 層             | 担当                                                              |
| -------------- | ----------------------------------------------------------------- |
| Domain Service | 「新規登録では User + Artist + Owner を作る」という**業務ルール** |
| Usecase        | 既存チェック、トランザクション境界、永続化、エラーハンドリング    |
| Repository     | 各Entityの個別永続化                                              |

Usecaseは「業務ルール」を書かず、Domain Serviceは「トランザクション・永続化」を書かない。責務が一切重複しない。

## このブランチで得られる設計上の効果

- **Usecase が「業務ルール」を書かない** — `registerNewUser()` を呼ぶだけ
- **Domain Service が「永続化」を書かない** — Entity を組み立てて返すだけ
- **Repository が「業務ルール」を書かない** — 単一Entityの永続化だけ
- **3層の責務が一切重複しない**
- **トランザクション境界が型として明示される**（`txRunner.run(tx => ...)`）
- **ドメインロジックとトランザクション境界の分離** — `集約境界 ≠ トランザクション境界` の原則を実装で示す

## 副次的な効果

- 将来「アーティストを後から追加する」「複数アーティストを所有する」といった別の業務操作が出てきた時、新しい Domain Service を追加するだけで既存の構造を壊さない
- Domain Service は純粋関数なのでモック不要でテストが書ける
- Usecase のテストは Repository モックだけで済む
- ArtistOwner が独立した概念として扱われるので、後から「Owner Role」「招待フロー」等を追加する余地がある

## エラーハンドリング

このブランチで新規追加するエラー:

| エラー                       | 層               | トリガー                           | HTTPステータス |
| ---------------------------- | ---------------- | ---------------------------------- | -------------- |
| `AccountIdAlreadyTakenError` | Domain (artists) | accountId のシステム全体一意性違反 | 409            |

既存の `UserAlreadyRegisteredError` (Usecase層) と併せ、エントリポイント層で 409 にマッピング。

## スコープ

### 含むもの

- `createArtist` factory 追加（Artist の新規生成）
- `domain/artistOwners/` 新設（4ファイル）
- `domain/services/userRegistration/` 新設
- `infrastructure/transaction/` 新設（`ITransactionRunner` + 実装）
- `infrastructure/repositories/artistOwnerRepository/` 新設
- `userRepository` / `artistRepository` の tx 対応
- `artistRepository.saveWithOwner` の廃止 → `save` に分離
- `createUserUseCase` の Domain Service + TransactionRunner 対応
- DI Container の更新
- `POST /api/users/create` の accountId 対応 + エラーマッピング
- 既存テストの追随 + 新規テスト追加

### 含まないもの

- BFFレイヤーの更新（次PR）
- onboarding 画面の API 連携（次PR）
- dashboard ページの実装（次PR）

## 検証方法

1. `npm test -- --filter api-server` がパス
2. `npm run build` がパス
3. 手動確認:
   - Auth0 認証後、`POST /api/users/create` に `{ email, accountId }` を送信して User + Artist + ArtistOwner が同一トランザクションで作成されること
   - 既存ユーザーで再度POSTすると 409（`UserAlreadyRegisteredError`）
   - 別ユーザーで重複する accountId を送ると 409（`AccountIdAlreadyTakenError`）
   - 失敗時に半登録状態（user だけ存在、artist が無い）が発生しないこと
