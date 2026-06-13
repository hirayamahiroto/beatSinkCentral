export const meta = {
  name: 'api-server-feature',
  description:
    'api-server（クリーンアーキテクチャ）へのバックエンド機能実装を 調査→実装→多面検証 で進めるハーネス',
  whenToUse:
    '新しい集約 / usecase / エンドポイント / DBスキーマ変更を api-server に実装するとき。args に機能概要や設計ドキュメントのパスを渡す。',
  phases: [
    { title: 'Research', detail: '規範ドキュメントと類似実装を読み、依存順の実装計画を作る' },
    { title: 'Implement', detail: '計画に沿って依存順に実装し、全 module にテストを書く' },
    { title: 'Verify', detail: 'test+tsc+lint / code-review-checklist / テスト網羅 を並行検証' },
  ],
}

// --- 構造化出力スキーマ -------------------------------------------------
const PLAN_SCHEMA = {
  type: 'object',
  required: ['summary', 'modules', 'risks'],
  properties: {
    summary: { type: 'string', description: '実装方針の要約' },
    docDivergences: {
      type: 'array',
      items: { type: 'string' },
      description: '設計ドキュメントと既存コードの食い違い（あればユーザー確認が必要）',
    },
    modules: {
      type: 'array',
      description: '作成/変更する module を依存順に',
      items: {
        type: 'object',
        required: ['path', 'layer', 'purpose', 'needsTest'],
        properties: {
          path: { type: 'string' },
          layer: {
            type: 'string',
            enum: [
              'schema',
              'migration',
              'valueObject',
              'entity',
              'behaviors',
              'factory',
              'policy',
              'repository-interface',
              'repository-impl',
              'container',
              'usecase',
              'route',
              'errorMap',
            ],
          },
          purpose: { type: 'string' },
          needsTest: { type: 'boolean' },
        },
      },
    },
    risks: { type: 'array', items: { type: 'string' } },
  },
}

const BUILD_SCHEMA = {
  type: 'object',
  required: ['testsPass', 'typecheckPass', 'lintPass', 'notes'],
  properties: {
    testsPass: { type: 'boolean' },
    typecheckPass: { type: 'boolean' },
    lintPass: { type: 'boolean' },
    notes: { type: 'string', description: '失敗の要点や、自分の変更起因かどうかの切り分け' },
  },
}

const REVIEW_SCHEMA = {
  type: 'object',
  required: ['findings'],
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['checkpoint', 'severity', 'location', 'detail'],
        properties: {
          checkpoint: {
            type: 'string',
            description: 'N+1 / scope / over-fetch / permission / interface / auth-scoping など',
          },
          severity: { type: 'string', enum: ['high', 'medium', 'low'] },
          location: { type: 'string' },
          detail: { type: 'string' },
        },
      },
    },
  },
}

const COVERAGE_SCHEMA = {
  type: 'object',
  required: ['modules', 'missingTests'],
  properties: {
    modules: {
      type: 'array',
      items: {
        type: 'object',
        required: ['path', 'isTypeOnly', 'hasTest'],
        properties: {
          path: { type: 'string' },
          isTypeOnly: { type: 'boolean', description: 'entity の型や repo interface 等' },
          hasTest: { type: 'boolean' },
        },
      },
    },
    missingTests: {
      type: 'array',
      items: { type: 'string' },
      description: '型のみでないのに index.test.ts が無い module',
    },
  },
}

// --- 本体 ---------------------------------------------------------------
const feature =
  typeof args === 'string'
    ? args
    : (args && (args.feature || args.description)) || '(機能概要が args で未指定)'

phase('Research')
const plan = await agent(
  `あなたは api-server の設計に精通したアーキテクト。次の機能の実装計画を作る。

機能: ${feature}

必ず読む:
- docs/server-architecture/architecture.md（レイヤー責務・classless OOP・依存方向）
- 上記機能に対応する docs/ 配下の設計ドキュメント（あれば grep で特定）
- docs/code-review-checklist.md
- 類似する既存ドメイン（apps/api-server/src/domain/users もしくは artists 一式）と既存 usecase/route

方針:
- 設計ドキュメントが規範。既存コードと食い違う点は docDivergences に列挙（勝手に合わせない）。
- DBの多値は 1:N テーブル。下書き許容項目は nullable + 公開/確定時 policy 検証。
- modules は依存順（schema→VO→entity→behaviors→factory→policy→repository→container→usecase→route→errorMap）。
- 型のみの module 以外は needsTest=true。`,
  { label: 'research:plan', phase: 'Research', schema: PLAN_SCHEMA, agentType: 'Explore' },
)
log(`計画: ${plan.modules.length} module / リスク ${plan.risks.length} 件`)
if (plan.docDivergences && plan.docDivergences.length > 0) {
  log(`⚠ ドキュメントと既存コードの食い違い ${plan.docDivergences.length} 件 — 実装前にユーザー確認を推奨`)
}

phase('Implement')
const implReport = await agent(
  `api-server に「${feature}」を実装する。計画:
${JSON.stringify(plan, null, 2)}

ルール（skill: api-server-feature に従う）:
- 依存順に実装。各 module（型のみを除く）に同階層 index.test.ts を必ず作る。
- classless OOP（クロージャで state 隠蔽）/ VO は createTypedError で型付きエラー / policy は純粋関数。
- repository は N+1・スコープ条件・過剰取得を避け、reconstructX で Entity を返す。
- 公開エンドポイントを足す場合は route.ts の auth を保護プレフィックスにスコープ化し、静的ルートをパラメータルートより先に登録。
- 新エラー型は errorMap の union と map 両方に追加。
- DBスキーマ変更時は npm run db:generate -w database（DATABASE_URL ダミー可）で migration 生成。
- **コミットはしない。** 実装した/変更したファイルの一覧と、設計上の判断（未決事項への暫定対応）を返す。`,
  { label: 'implement', phase: 'Implement' },
)

phase('Verify')
const [build, review, coverage] = await parallel([
  () =>
    agent(
      `次を実行して結果を報告する:
- npm test -- --filter api-server
- cd apps/api-server && npx tsc --noEmit -p tsconfig.json
- cd apps/api-server && npx next lint
tsc の既存エラー（自分の diff 外のテストモック等）は git status で切り分け、自分の変更起因のみを失敗として扱う。`,
      { label: 'verify:build', phase: 'Verify', schema: BUILD_SCHEMA },
    ),
  () =>
    agent(
      `git diff（作業ブランチの変更）を docs/code-review-checklist.md に照らして敵対的にレビューする。
特に: N+1 / マルチテナントのスコープ条件 / 過剰取得 / 権限のない親リソース情報の露出 / インターフェース自己説明性(null初期化) / 公開ルートの認証スコープ。
確証のある指摘のみ findings に挙げる。`,
      { label: 'verify:review', phase: 'Verify', schema: REVIEW_SCHEMA },
    ),
  () =>
    agent(
      `作業ブランチの diff にある新規 module を列挙し、それぞれ index.test.ts があるかを判定する。
型のみの module（entity の型定義、repository interface）は isTypeOnly=true でテスト不要。
型のみでないのにテストが無いものを missingTests に挙げる。`,
      { label: 'verify:tests', phase: 'Verify', schema: COVERAGE_SCHEMA },
    ),
])

const verdict = {
  green: build.testsPass && build.typecheckPass && build.lintPass,
  highFindings: (review.findings || []).filter((f) => f.severity === 'high'),
  missingTests: coverage.missingTests || [],
}
log(
  `検証: build green=${verdict.green} / high指摘 ${verdict.highFindings.length} / テスト未整備 ${verdict.missingTests.length}`,
)

return { feature, plan, implReport, build, review, coverage, verdict }
