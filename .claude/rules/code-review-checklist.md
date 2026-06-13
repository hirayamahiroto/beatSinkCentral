# コードレビュー自動チェック観点

実装コードを書く際・レビューする際に、以下の観点を必ずチェックすること。
これらはプロジェクト共通のコード品質基準であり、すべての実装に適用される。

## 1. N+1クエリの防止

- ループ内でDBクエリやAPI呼び出しを行っていないか確認する
- 配列の各要素に対して個別にクエリを発行している場合、JOINやIN句で1クエリにまとめる
- ネストしたN+1（N+1の中にさらにN+1）は特に注意。データ量に応じてO(n^2)以上の負荷になる
- 「参照数が多いケース（数百件〜）」を想定してパフォーマンスを評価する

### パターンA: ループ内で個別にクエリを発行する

```typescript
// NG: itemIdsの件数分だけcheckItemPermissionが逐次実行される
for (const itemId of itemIds) {
  const hasPermission = await checkItemPermission({
    teamId,
    itemId,
    userId: currentMembership.userId,
    roleType: currentMembership.roleType,
  });
  if (!hasPermission) throw forbiddenError;
}

// OK: IN句やサブクエリで1クエリにまとめる
const permittedCount = await db
  .select({ count: count() })
  .from(item)
  .where(
    and(
      inArray(item.id, itemIds),
      eq(item.teamId, teamId),
      exists(
        db.select().from(permissionSq).where(eq(item.id, permissionSq.itemId)),
      ),
    ),
  );
if (permittedCount !== itemIds.length) throw forbiddenError;
```

### パターンB: map + Promise.allで個別にクエリを発行する

```typescript
// NG: 参照元記事ごとにリビジョンを個別取得（参照が100件あれば100クエリ）
const referencingArticles = await Promise.all(
  allRefs.map((ref) => getArticleInfo(ref.articleId)),
);

async function getArticleInfo(articleId: string) {
  const revision = await db.query.articleRevision.findFirst({
    where: (rev, { eq }) => eq(rev.articleId, articleId),
    orderBy: (rev) => [desc(rev.editedAt), desc(rev.id)],
  });
  return { id: articleId, title: revision?.title ?? "無題" };
}

// OK: JOINで1クエリにまとめる
const referencingArticles = await db
  .select({
    id: articleSource.articleId,
    title: articleRevision.title,
  })
  .from(articleSource)
  .innerJoin(
    latestRevision,
    eq(articleSource.articleId, latestRevision.articleId),
  )
  .innerJoin(articleRevision, eq(latestRevision.id, articleRevision.id))
  .where(eq(articleSource.resourceItemId, assetItemId));
```

### パターンC: 全件取得後にアプリケーション側でフィルタする

```typescript
// NG: DB側で絞れる条件をアプリ側のArray.filterで処理（全件取得のコスト）
const data = await db.query.item.findMany({
  where: and(eq(item.teamId, teamId), eq(item.type, "asset")),
  with: {
    asset: {
      with: {
        /* 大量のリレーション */
      },
    },
  },
});
const filtered = data.filter(
  (item) => item.asset.parentFolderId === parentFolderId,
);

// OK: DB側のwhere句で絞る
const data = await db.query.item.findMany({
  where: and(
    eq(item.teamId, teamId),
    eq(item.type, "asset"),
    eq(asset.parentFolderId, parentFolderId),
  ),
  with: {
    asset: {
      with: {
        /* 大量のリレーション */
      },
    },
  },
});
```

### パターンD: 同じ重いクエリを複数回実行する

```typescript
// NG: 再帰CTEを含む重いクエリが複数の関数から重複実行される
const [inaccessible, metadata, articleCount] = await Promise.all([
  hasInaccessibleContent({ folderId }), // 内部で getDescendantFolderIds() を実行
  getContentsMetadata({ folderId }), // 内部で getDescendantFolderIds() を実行
  getReferencingArticleCount({ folderId }), // 内部で getDescendantFolderIds() を実行
]);

// OK: 共通のクエリ結果を事前に1回取得して使い回す
const descendantFolderIds = await getDescendantFolderIds({ folderId });
const [inaccessible, metadata, articleCount] = await Promise.all([
  hasInaccessibleContent({ descendantFolderIds }),
  getContentsMetadata({ descendantFolderIds }),
  getReferencingArticleCount({ descendantFolderIds }),
]);
```

## 2. 不要なデータの過剰取得の防止

- 一覧表示など用途が限定されている場面で、不要なリレーションやカラムまで取得していないか確認する
- 件数だけ必要な場面では `count()` を使い、全行取得して `.length` で数えない
- 大量データになりうるクエリには `limit` やページネーションを設定する

### パターンE: 不要なリレーション・カラムの過剰取得

```typescript
// NG: 一覧表示に必要なのはファイル名とサムネイル程度なのに、全サブテーブルを常に取得
const data = await db.query.item.findMany({
  where: and(eq(item.teamId, teamId), eq(item.type, "asset")),
  with: {
    asset: {
      with: {
        assetAudio: true,
        assetVideo: true,
        assetDocument: true,
        assetData: true,
        assetImage: true,
        assetOther: true,
      },
    },
  },
});

// OK: 用途に応じて必要なリレーションだけ取得する（一覧用と詳細用でクエリを分ける）
const data = await db.query.item.findMany({
  where: and(eq(item.teamId, teamId), eq(item.type, "asset")),
  with: {
    asset: {
      columns: { fileName: true, type: true, parentFolderId: true },
      with: {
        assetUrls: { limit: 1 },
      },
    },
  },
});
```

### パターンF: 件数確認のために全行取得する

```typescript
// NG: 件数を知りたいだけなのに全行取得して.lengthで数える
const items = await db.query.item.findMany({
  where: eq(item.parentFolderId, folderId),
});
if (items.length === 0) return;

// OK: count()で件数だけ取得する
const [result] = await db
  .select({ count: count() })
  .from(item)
  .where(eq(item.parentFolderId, folderId));
if (result.count === 0) return;
```

### パターンG: 上限なしの無制限取得

```typescript
// NG: データ量が増加すると際限なく取得される
const allArticles = await db.query.article.findMany({
  where: eq(article.teamId, teamId),
});

// OK: limitやページネーションで取得量を制限する
const articles = await db.query.article.findMany({
  where: eq(article.teamId, teamId),
  limit: 100,
  offset: page * 100,
});
```

## 3. 機密情報・権限のない情報の露出防止

- アクセス権限のないリソースの情報（タイトル、名前など）をクライアントに返していないか確認する
- 権限チェックで弾いたリソースについては、件数（count）のみ返すなど、メタデータを露出させない設計にする
- 親リソースに権限がない場合、その親リソースの情報（フォルダ名など）も露出対象になることに注意する

## 4. 関数の命名と責務の一致

- 関数名が実際の振る舞いを正確に表しているか確認する
- 1つの関数が複数の責務を持っていないか確認する
- 「チェック関数」がチェック以外のデータ取得も行っている場合、責務を分離する
- 命名例: `checkX` → boolean/件数を返す、`getXMetadata` → メタデータを返す

## 5. クエリ条件の網羅性（スコープ条件の徹底）

- マルチテナント環境ではteamIdなどのスコープ条件がクエリに含まれているか確認する
- 「ほとんどのケースでは問題ない」条件でも、安全側に倒して条件に含める
- 階層構造のデータでは再帰クエリ（WITH RECURSIVE / 再帰CTE）が必要かどうか検討する
- **関数の引数に `teamId` や `userId` を受け取っている場合、それらは必ずクエリ条件に使用する。引数にあるのにクエリで使っていないのは設計上の矛盾**
- UUIDの衝突確率が低いことに依存せず、スコープ条件で明示的に絞る

```typescript
// NG: リソースIDだけで絞る（UUIDが一意であることに依存している）
const result = await db
  .select({ count: count() })
  .from(articleSource)
  .innerJoin(item, eq(articleSource.articleId, item.id))
  .where(eq(articleSource.resourceItemId, assetItemId));

// OK: スコープ条件（teamId）を含めて防御的に絞る
const result = await db
  .select({ count: count() })
  .from(articleSource)
  .innerJoin(item, eq(articleSource.articleId, item.id))
  .where(
    and(eq(articleSource.resourceItemId, assetItemId), eq(item.teamId, teamId)),
  );
```

```typescript
// NG: 権限チェック関数でuserId/teamIdを受け取っているのにクエリで未使用
async function checkDeletable({ teamId, userId, itemId }: Args) {
  return db.select().from(item).where(eq(item.id, itemId));
}

// OK: 受け取った引数は全てクエリ条件に反映する
async function checkDeletable({ teamId, userId, itemId }: Args) {
  return db
    .select()
    .from(item)
    .where(and(eq(item.id, itemId), eq(item.teamId, teamId)));
}
```

## 6. データ取得タイミングの最適化

- 表示時に不要なデータを事前に取得していないか確認する
- モーダルやダイアログの内容は、開かれるタイミングで遅延取得（オンデマンド取得）する
- 一覧表示で各行の詳細データまで取得していないか確認する

## 7. 既存コードの再利用

- 類似のロジックが既に存在しないか、実装前に確認する
- 新規関数を作る前に、既存関数を拡張できないか検討する
- 重複ロジックがある場合、共通化の判断基準を明確にする（型の違い、ドメインの違いなど）

## 8. ライブラリAPIの優先使用（生SQL/低レベル記述の回避）

- プロジェクトで採用しているライブラリ（ORM、フレームワーク等）のAPIを最大限活用して実装する
- ライブラリが提供するAPIで実現できる処理に対して、生SQLやローレベルな記述を併用しない
- ライブラリがサポートしていない処理（例: 再帰CTE等）でやむを得ず生SQLが必要な場合は、その旨をコメントに明記し、レビューで協議する
- 生SQLを書く範囲は最小限に留め、ライブラリAPIと混在する部分を局所化する

```typescript
// NG: ライブラリ（Drizzle）で書けるのにサブクエリ内で生SQLを使う
const latestRevision = db
  .select({
    articleId: articleRevision.articleId,
    id: sql<string>`(
      SELECT ar2.id FROM article_revision ar2
      WHERE ar2.article_id = ${articleRevision.articleId}
      ORDER BY ar2.edited_at DESC NULLS LAST, ar2.id DESC
      LIMIT 1
    )`.as("latest_revision_id"),
  })
  .from(articleRevision)
  .groupBy(articleRevision.articleId)
  .as("latest_rev");

// OK: ライブラリのAPIで完結させる
const latestRevision = db
  .selectDistinctOn([articleRevision.articleId], {
    articleId: articleRevision.articleId,
    id: articleRevision.id,
  })
  .from(articleRevision)
  .orderBy(
    articleRevision.articleId,
    desc(articleRevision.editedAt),
    desc(articleRevision.id),
  )
  .as("latest_rev");
```

```typescript
// やむを得ず生SQLが必要な場合: コメントで理由を明記する
// NOTE: Drizzleは再帰CTE（WITH RECURSIVE）を未サポートのため生SQLを使用
const descendantFolderIds = await db.execute(sql`
  WITH RECURSIVE descendants AS (
    SELECT id FROM asset_folder WHERE id = ${folderId}
    UNION ALL
    SELECT af.id FROM asset_folder af
    INNER JOIN descendants d ON af.parent_folder_id = d.id
  )
  SELECT id FROM descendants
`);
```

## 9. SQLレイヤーとアプリケーションレイヤーの責務分離

- データのフィルタ・集計・整形・変換はSQL側で完結させ、アプリケーション層でのデータ加工を避ける
- SQLクエリの返却値がそのまま呼び出し元の期待する形であるべき。取得後に`.map`や`.filter`で変換が必要な場合、クエリ設計を見直す
- 責務を分離することで、実装の引き継ぎや移行時にロジックの所在が明確になる

```typescript
// NG: SQL取得後にアプリ層でフィルタ・変換している
const allItems = await db.query.item.findMany({
  where: eq(item.teamId, teamId),
  with: { asset: true },
});
const assetItems = allItems
  .filter((item) => item.asset !== null)
  .filter((item) => item.asset.parentFolderId === folderId)
  .map((item) => ({
    id: item.id,
    fileName: item.asset.fileName,
    type: item.asset.type,
  }));

// OK: 必要なデータをSQL側で絞り込み・整形して返す
const assetItems = await db
  .select({
    id: item.id,
    fileName: asset.fileName,
    type: asset.type,
  })
  .from(item)
  .innerJoin(asset, eq(item.id, asset.itemId))
  .where(and(eq(item.teamId, teamId), eq(asset.parentFolderId, folderId)));
```

```typescript
// NG: 取得後にアプリ層で集計している
const articles = await db.query.article.findMany({
  where: eq(article.teamId, teamId),
});
const countByStatus = {
  draft: articles.filter((a) => a.status === "draft").length,
  published: articles.filter((a) => a.status === "published").length,
};

// OK: SQL側で集計する
const countByStatus = await db
  .select({
    status: article.status,
    count: count(),
  })
  .from(article)
  .where(eq(article.teamId, teamId))
  .groupBy(article.status);
```

## 10. レイヤー間の責務境界の遵守

各レイヤー（エントリポイント / データ操作 / ビジネスロジック / UI）には固有の責務があり、それを越境しない。
責務が混在すると、変更の影響範囲が広がり、テストが書きにくくなり、引き継ぎ時にロジックの所在が不明になる。

### 原則

- **エントリポイント層**（APIハンドラ、Server Action等）: 認証・認可・バリデーション・キャッシュ制御のみ。データ操作やビジネスロジックを直接書かない
- **データ操作層**（リポジトリ、operations等）: 純粋なCRUD・トランザクション。認証やフレームワーク依存を持ち込まない
- **ビジネスロジック層**（lib、utils等）: 純粋関数。DB依存もフレームワーク依存もない。入力はデータ、出力もデータ
- **UI層**: 表示とユーザー操作の受け取りのみ。データ取得ロジックやビジネスルールを直接書かない

### チェックポイント

- 1つの関数に認証チェック + DBクエリ + ビジネス判定 + レスポンス整形が全部入っていないか
- データ操作関数の中にフレームワーク固有のAPI（キャッシュ、セッション等）が混入していないか
- 純粋関数として書けるロジック（状態算出、可否判定、データ変換）がDB層やAPI層に埋まっていないか

```typescript
// NG: エントリポイントにデータ操作もビジネスロジックも全部入っている
async function deleteAssetAction(assetId: string, teamId: string) {
  const user = await getCurrentUser()
  const membership = await getMembership({ teamId, userId: user.id })
  // 認可チェック（エントリポイントの責務 → OK）
  if (!hasPermission(membership.roleType, 'manageAsset')) throw forbiddenError

  // ビジネスロジックがエントリポイントに直接書かれている → NG
  const refs = await db.select().from(articleSource).where(eq(articleSource.resourceItemId, assetId))
  const accessible = refs.filter((r) => /* 権限判定ロジック */)
  if (refs.length !== accessible.length) throw forbiddenError

  // データ操作がエントリポイントに直接書かれている → NG
  await db.delete(item).where(eq(item.id, assetId))
  revalidateTag('assets')
  return { success: true }
}

// OK: 各レイヤーに責務を分離する
// エントリポイント: 認証 → 認可 → 操作委譲 → キャッシュ制御
async function deleteAssetAction(assetId: string, teamId: string) {
  const user = await getCurrentUser()
  const membership = await getMembership({ teamId, userId: user.id })
  if (!hasPermission(membership.roleType, 'manageAsset')) throw forbiddenError

  const { inaccessibleCount } = await checkAssetDeletable({ teamId, assetId, ...membership })
  if (inaccessibleCount > 0) throw forbiddenError

  await deleteAsset({ assetId, teamId })
  revalidateTag('assets')
  return { success: true }
}

// データ操作層: 純粋なDB操作のみ
async function deleteAsset({ assetId, teamId }: { assetId: string; teamId: string }) {
  await db.delete(item).where(and(eq(item.id, assetId), eq(item.teamId, teamId)))
}

// ビジネスロジック層: 純粋関数（DB不要な判定の場合）
function canDeleteAsset(inaccessibleCount: number): boolean {
  return inaccessibleCount === 0
}
```

### ロジック配置の判断基準

| ロジックの性質                                 | 配置先             | 例                                   |
| ---------------------------------------------- | ------------------ | ------------------------------------ |
| データから算出できる（純粋関数）               | ビジネスロジック層 | ステータス算出、可否判定、データ変換 |
| DB参照・更新が必要                             | データ操作層       | CRUD、重複チェック、集計クエリ       |
| 認証・認可・キャッシュに絡む                   | エントリポイント層 | Server Action、APIハンドラ           |
| 上記の複数entityにまたがるオーケストレーション | feature層          | 複合操作、ワークフロー               |

## 11. インターフェース設計の簡潔さ

- 返却値に不要なフィールドが含まれていないか確認する
- 他のフィールドから自明に導出できる値（例: countから導出できるhasXフラグ）は含めない
- クライアントが本当に必要とするデータだけを返す

## 12. 階層構造における権限の連鎖的遮断

- 親リソース（フォルダ、グループ等）に権限がない場合、その配下の子リソースに個別の権限があっても、親リソースの情報（名前、タイトル等）をクライアントに返してはならない
- 権限のない親リソースの存在そのものが機密情報になりうるため、件数（count）のみ返すか、親情報を null にして返す
- 子リソースの一覧を返す際、各子リソースが所属する親リソースのメタデータを付与する場合は、親リソースへの権限も合わせてチェックする
- 「子リソースに権限あり → 親の情報も見せてよい」とは限らない。権限モデルを確認し、安全側に倒す

```typescript
// NG: 素材にはアクセス権があるが、親フォルダの権限をチェックせずフォルダ名を返している
const assets = await db
  .select({
    id: asset.id,
    title: asset.title,
    folderName: assetFolder.title, // ← 親フォルダに権限がなくても名前が露出する
  })
  .from(asset)
  .innerJoin(item, eq(asset.id, item.id))
  .leftJoin(assetFolder, eq(asset.parentFolderId, assetFolder.id))
  .where(
    exists(
      db.select().from(permissionSq).where(eq(item.id, permissionSq.itemId)),
    ),
  );

// OK: 親フォルダの権限もチェックし、権限がなければ null で返す
const folderNameWithPermission = sql<string | null>`
  CASE WHEN EXISTS (
    SELECT 1 FROM ${folderPermissionSq}
    WHERE ${folderPermissionSq.itemId} = ${assetFolder.id}
  ) THEN ${assetFolder.title} ELSE NULL END
`.as("folder_name");

const assets = await db
  .select({
    id: asset.id,
    title: asset.title,
    folderName: folderNameWithPermission,
  })
  .from(asset)
  .innerJoin(item, eq(asset.id, item.id))
  .leftJoin(assetFolder, eq(asset.parentFolderId, assetFolder.id))
  .where(
    exists(
      db.select().from(permissionSq).where(eq(item.id, permissionSq.itemId)),
    ),
  );
```

## 13. インターフェースの自己説明性（型で制約を伝える）

- 「正しい使い方」を暗黙の知識ではなく、型で表現する
- 実装の中身を読まなくても、返り値の型だけ見て正しく使えるインターフェースにする
- 間違った使い方が「静かに成功する」設計を避ける。間違いはコンパイルエラーか明示的な `null` チェックで気づけるようにする

### 問い直すべき観点

1. **自分の前提を疑う** — 「この関数を先に呼ぶのは当然」は、実装者だけが知っている暗黙知ではないか？
2. **型を読む人の目線になる** — 返り値の型だけ見て、正しく使えるか？ソースを読まないと分からないルールが隠れていないか？
3. **間違った使い方をしたとき何が起きるか** — エラーにならず動いてしまう（静かに成功する）のが一番危険
4. **型で制約を表現できないか** — 人間のルール（「先にfetchを呼ぶ」）をコンパイラが強制できるルール（`null` チェック必須）に変換する

### 13-1. 非同期取得データの初期値設計

- hookやstateで非同期に取得するデータの初期値に `0` や空配列 `[]` を使わない
- 「未取得」と「取得済みでゼロ/空」を型レベルで区別できるよう `null` で初期化する
- 導出値（isDeletable, isMovable等）も未取得時は `null` を返し、利用側が状態を判断できるようにする
- インターフェース（型）だけ見て正しく使える設計にし、実装の中身を読まないと使えない暗黙のルールを作らない

```typescript
// NG: 0で初期化 → fetchを呼び忘れても isDeletable === true → 誤表示
const [inaccessibleCount, setInaccessibleCount] = useState(0);
const isDeletable = inaccessibleCount === 0;

// OK: nullで初期化 → 未取得はnull、取得後にtrue/false
const [inaccessibleCount, setInaccessibleCount] = useState<number | null>(null);
const isDeletable = inaccessibleCount !== null ? inaccessibleCount === 0 : null;
// isDeletable: null（未取得）→ ボタンdisabled
// isDeletable: true（取得済み・OK）→ ボタン有効
// isDeletable: false（取得済み・NG）→ ボタン無効
```

### 判断基準: 初期値に正当な取得結果と同じ値を使っていないか

初期値が「取得済みで問題なし」の値と一致する場合、未取得と取得済みを区別できない。
APIから返りえない値（`null`）を初期値にすることで、「まだ取得していない」を安全に表現する。

```
0（初期値）= 0（取得済み・問題なし） → 区別不能 ❌
null（初期値）≠ 0（取得済み・問題なし） → 区別可能 ✅
```

### チェックポイント

- `useState(0)` や `useState([])` で初期化したstateが、非同期取得前に参照されていないか
- **初期値が正当な取得結果としても返りうる値ではないか**（0, 空配列, false 等）
- 導出値が初期状態で「問題なし」と判定されてしまわないか
- hookの返り値の型だけ見て、利用側が正しい使い方を判断できるか

## 14. 実装コメントを残さない（構造と命名で役割を明確にする）

実装には**基本的にコメントを残さない**。コードの役割は**構造（関数分割・レイヤー配置）と命名**で明確にする。これは全プロジェクト共通の方針である。

- コードを言い換えただけのコメント（`// ユーザーを取得` の上に `getUser()` 等）は書かない／見つけたら削除する。
- 「何をしているか」はコード自体で読めるようにする。読めないならコメントを足すのではなく、**命名・関数分割・型**を改善する。
- 「なぜそうしたか（設計判断・背景・トレードオフ）」は、コメントではなく**設計ドキュメント（`docs/`）**に書く。
- 例外的に残してよいのは、**コードからは絶対に読み取れない外部制約**のみ（例: ライブラリのバグ回避、仕様上やむを得ない順序依存）。その場合も理由を一行で明記する。

```typescript
// NG: コードの言い換え／自明なコメント
// 名前が空ならエラー
if (name === "") throw new Error("name is required");

// セッションを取得する
const session = await auth0.getSession();

// OK: コメントなし。命名と構造で意図が読める
if (name === "") throw createNameRequiredError();
const session = await auth0.getSession();

// OK（例外）: コードから読めない外部制約のみ理由を明記
// Drizzleは再帰CTE未サポートのため生SQLを使用
const rows = await db.execute(sql`WITH RECURSIVE ...`);
```

### チェックポイント
- 追加したコメントは「コードの言い換え」になっていないか → なっていれば削除し、命名/分割で表現する。
- 設計の理由をコメントに書こうとしていないか → `docs/` に書く。
- そのコメントが無いと**コードから読み取れない外部制約**か → そうでなければ消す。

## 15. 型安全を壊す Optional フォールバックを使わない

必須の値に対して **`optional chaining + フォールバック既定値`**（`x?.y ?? ""` / `?? 0` / `?? []` / `?? false` 等）で「無い場合の偽の値」を埋めない。これは全レイヤー共通（UI / エントリポイント / ビジネスロジック / データ操作）。

- `?? ""` 等は「値が無い」状態を**正当に見える値で塗りつぶし、型安全を壊す**。型上は `string` でも実体は「未取得/欠落」で、バグが静かに通る（§13 の「未取得とゼロを区別」と同根）。
- 必須値が欠ける可能性があるなら **明示的に分岐して落とす**（`if (!x) throw ... / redirect(...)`）。`throw` / `redirect` は `never` を返すので、以降は型が実体（`string` 等）に絞られる。
- または **正しく型付けされた契約から取得する**（optional な claim ではなく、DB 由来の `string` を返す API など）。
- 真に任意の値（リクエストの cookie 等、本来 optional なもの）を、optional を要求する API に渡すための `null → undefined` 正規化は可（必須値の偽装ではないため）。判断軸は「その値は必須か、本当に任意か」。

```typescript
// NG: 必須値を偽の既定値で埋めて型安全を壊す
const email = session.user?.email ?? ""; // "" は「未取得」を隠す嘘
const count = data?.total ?? 0; // 0 は「取得済み0件」と区別できない

// OK: 欠落を明示的に落とし、型を実体に絞る
if (!session) redirect("/auth/login");
const me = await fetchMe(); // me.email は契約上 string
if (!me.registered) redirect("/onboarding");
const email = me.email; // string（偽の既定値なし）

// OK（例外）: 本来 optional な値の null→undefined 正規化
const cookie = headers().get("cookie") ?? undefined; // cookie は任意
```

### チェックポイント
- `?? ""` / `?? 0` / `?? []` / `?? false` で**必須値**を埋めていないか → 明示分岐か正しい型の契約に置き換える。
- その既定値は「API から正当に返りうる値」と区別がつくか（§13 と同じ判断）。
- `x?.y` で読んだ必須値を、null/undefined のまま下流へ流していないか。

## チェック実施タイミング

- 新しい関数やAPIエンドポイントを実装したとき
- DBクエリを含むコードを書いたとき
- 権限チェックに関わるコードを書いたとき
- 既存コードに似た処理を新規に書こうとしたとき
- hookやstateの初期値を設定するとき
- **コメントを書こうとしたとき（まず命名・構造・docs で代替できないか）**
- **`?? 既定値` を書こうとしたとき（その値は必須か任意か）**
