# DB設計 - Artists / Users / Teams テーブル設計

> この設計は [DB設計指針](../server-architecture/database-design.md) に基づいている。

---

## 1. ドメインの定義

### Artistとは何か

> **Artistは表現者である**

- ソロ・チームはArtistの内部構造に過ぎない
- どちらも「表現者」であるため、同じArtistsテーブルに存在してよい
- soloかteamかはデータ構造が表現する（typeカラムは不要）

### なぜtypeカラムはアンチパターンか

```
typeカラムを持つ
→ DBが「これはsoloだ / teamだ」という判断を持つ
→ 振る舞いの判断はアプリケーションの責務
→ DBの責務を超えている
```

```
あるべき状態:
artist_membersにレコードがある → teamとして機能する
artist_membersにレコードがない → soloとして機能する
```

テーブルの構造とレコードの有無が状態を表現し、カラムに状態を持たせない。

---

## 2. テーブル設計

### ERD

```
users
├── id          uuid PK
├── sub         varchar(255) UNIQUE  ← Auth0 識別子
├── email       varchar(255) UNIQUE
├── name        varchar(255)
├── created_at  timestamp
└── updated_at  timestamp

artists
├── id          uuid PK
├── account_id  varchar(255) UNIQUE
├── created_at  timestamp
└── updated_at  timestamp

artist_owners (所有の事実を記録)
├── id          uuid PK
├── user_id     uuid FK → users.id
├── artist_id   uuid FK → artists.id
├── created_at  timestamp
└── UNIQUE(user_id, artist_id)

artist_members (チーム構成・招待状態を記録)
├── id          uuid PK
├── artist_id   uuid FK → artists.id
├── user_id     uuid FK → users.id
├── invited_by  uuid FK → users.id
├── invited_at  timestamp
├── accepted_at timestamp (nullable)
└── UNIQUE(artist_id, user_id)

artist_profiles (※将来追加。プロフィール項目確定後)
├── artist_id   uuid FK → artists.id
└── ...詳細情報
```

### テーブルの責務

| テーブル | 責務 |
|---|---|
| `users` | ログイン情報のみを持つ |
| `artists` | 表現者としての属性を持つ |
| `artist_owners` | UserがArtistを所有している事実を記録する |
| `artist_members` | チームの構成と招待状態を記録する |
| `artist_profiles` | Artistの詳細情報を持つ（将来追加） |

---

## 3. 設計判断のプロセス

### artist_ownersが必要になった理由

```
「Artistは表現者である」という定義
　　　↓
soloもteamも表現者である
　　　↓
1人のUserがsoloとしてもteamとしても活動できる
　　　↓
User 1人に対してArtistが複数紐づく可能性がある（1:N）
　　　↓
ArtistsテーブルにFKとしてuser_idを持たせる構成では破綻する
　　　↓
artist_owners中間テーブルで関係を表現する
```

業界の実態としてsolo・teamの複数パターンが存在するため、早すぎる最適化ではなく根拠のある設計判断。

### artist_membersの設計判断

- `invited_at` / `accepted_at` で招待状態を構造的に表現する
- `accepted_at` が NULL → 招待中、値あり → 参加済み
- is_active のようなフラグは振る舞いの判断をDBに持たせることになるため採用しない

---

## 4. 今やること / やらないこと

### 今やること

- 上記のテーブル構成で実装を進める
- `invited_by` で招待者（発起人）の事実を記録する

### 今やらないこと（将来対応）

| 項目 | 理由 |
|---|---|
| Owner権限の移譲 | 脱退・譲渡の仕様が固まってから対応 |
| ownership_historyテーブル | 権限移譲が発生した時点で追加 |
| artist_ownersへのrole追加 | 所有権分散の仕様が固まってから対応 |
| 脱退・削除の論理削除設計 | 別タスクで設計 |
| artist_profiles | プロフィール項目が確定してから追加 |

### 将来の拡張方向性（見えている状態）

```
所有権の分散が必要になった場合
→ artist_ownership_historyテーブルを追加
→「権限の移譲という出来事」をイベントとして記録
→ 現在のOwnerはアプリケーションが履歴の最新を見て判断

チームメンバーの脱退が必要になった場合
→ left_atカラムを追加（タイムスタンプの有無で脱退状態を表現）
→ フラグカラムは使わない
```
