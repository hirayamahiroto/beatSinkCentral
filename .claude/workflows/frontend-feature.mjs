export const meta = {
  name: 'frontend-feature',
  description:
    'beatfolio / packages/ui のフロントエンド UI 実装を 調査→実装→多面検証 で進めるハーネス（Atomic Design + shadcn + デザインシステム）',
  whenToUse:
    '新しい画面 / フォーム / コンポーネントを実装するとき。args に機能概要や情報設計ドキュメントのパスを渡す。',
  phases: [
    { title: 'Research', detail: '規範ドキュメントと類似コンポーネントを読み、Atomic Design 順の実装計画を作る' },
    { title: 'Implement', detail: '計画に沿って部品から実装し、各コンポーネントに story を書く' },
    { title: 'Verify', detail: 'tsc / デザインシステム準拠レビュー / story 網羅 を並行検証' },
  ],
}

// --- 構造化出力スキーマ -------------------------------------------------
const PLAN_SCHEMA = {
  type: 'object',
  required: ['summary', 'components', 'risks'],
  properties: {
    summary: { type: 'string', description: '実装方針の要約' },
    docDivergences: {
      type: 'array',
      items: { type: 'string' },
      description: '設計ドキュメントと既存コードの食い違い（あればユーザー確認が必要）',
    },
    shadcnToAdd: {
      type: 'array',
      items: { type: 'string' },
      description: '不足していて shadcn add が必要な primitive 名',
    },
    components: {
      type: 'array',
      description: '作成/変更するコンポーネントを Atomic Design 順に',
      items: {
        type: 'object',
        required: ['path', 'layer', 'purpose', 'needsStory'],
        properties: {
          path: { type: 'string' },
          layer: {
            type: 'string',
            enum: [
              'info-design',
              'primitive',
              'atom',
              'molecule',
              'organism',
              'app-page',
              'app-adapter',
              'hook',
            ],
          },
          purpose: { type: 'string' },
          needsStory: { type: 'boolean', description: 'UI 描画する atom/molecule/organism は true' },
        },
      },
    },
    risks: { type: 'array', items: { type: 'string' } },
  },
}

const BUILD_SCHEMA = {
  type: 'object',
  required: ['typecheckPass', 'notes'],
  properties: {
    typecheckPass: { type: 'boolean' },
    notes: { type: 'string', description: '失敗の要点。自分の変更起因か既存（.jpeg 等）かの切り分け' },
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
            description:
              'color-token(アドホック色) / atom-structure(atomに構造スタイル) / rhf-placement(RHFをmolecule以下に) / use-client-boundary / next-dep-in-ui / story-description(実装詳細) / a11y',
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
  required: ['components', 'missingStories'],
  properties: {
    components: {
      type: 'array',
      items: {
        type: 'object',
        required: ['path', 'isRenderable', 'hasStory'],
        properties: {
          path: { type: 'string' },
          isRenderable: { type: 'boolean', description: 'UI を描画する atom/molecule/organism か' },
          hasStory: { type: 'boolean' },
        },
      },
    },
    missingStories: {
      type: 'array',
      items: { type: 'string' },
      description: '描画系なのに index.stories.tsx が無いコンポーネント',
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
  `あなたは beatfolio / packages/ui の UI 設計に精通したフロントエンドアーキテクト。次の機能の実装計画を作る。

機能: ${feature}

必ず読む:
- docs/frontend-architecture/component-design.md（Atomic Design・文脈の有無・"use client" 境界）
- docs/frontend-architecture/form-design.md（RHF は organism 以上・register/Controller）
- docs/frontend-architecture/{application-policy,state-management,ui-library,tailwind}.md
- 対象機能の情報設計ドキュメント（docs/ 配下を grep で特定）
- 既存の似た atom/molecule/organism（packages/ui/src/design-system/components 配下）と global.css のカラートークン

方針:
- 設計ドキュメントが規範。既存コードと食い違う点は docDivergences に列挙（勝手に合わせない）。
- カラーは neutral dark トークン（bg-background / text-foreground / bg-primary / text-muted-foreground 等）。アドホック色は使わない。
- 不足 primitive は shadcnToAdd に列挙（shadcn add で追加する想定）。
- components は Atomic Design 順（primitive→atom→molecule→organism→app-page→app-adapter）。
- 描画する atom/molecule/organism は needsStory=true。`,
  { label: 'research:plan', phase: 'Research', schema: PLAN_SCHEMA, agentType: 'Explore' },
)
log(`計画: ${plan.components.length} コンポーネント / shadcn追加 ${(plan.shadcnToAdd || []).length} / リスク ${plan.risks.length}`)
if (plan.docDivergences && plan.docDivergences.length > 0) {
  log(`⚠ ドキュメントと既存コードの食い違い ${plan.docDivergences.length} 件 — 実装前にユーザー確認を推奨`)
}

phase('Implement')
const implReport = await agent(
  `beatfolio / packages/ui に「${feature}」の UI を実装する。計画:
${JSON.stringify(plan, null, 2)}

ルール（skill: frontend-feature に従う）:
- Atomic Design 順に実装。描画する atom/molecule/organism に index.stories.tsx を必ず作る（description は責務と使い時に絞る）。
- 不足 primitive は cd packages/ui && npx shadcn@latest add <name> --yes で追加（生成物は改変しない・index.ts に export）。
- atom は primitive を薄くラップし色味のみ上書き（構造スタイルを持たない）。表現は variant/tone 軸で追加。
- molecule は RHF 非依存の Controlled API（value/onChange/ref）。RHF + zod は organism 以上。register 優先・Controller は非ネイティブのみ・配列は useFieldArray。
- カラーは neutral dark トークンのみ。アドホック色禁止。
- "use client" は app の ClientAdapter のみ。packages/ui に next/* を import しない。page.tsx はサーバーでデータ取得/redirect。
- **コミットはしない。** 実装/変更したファイル一覧と設計上の判断（未決事項への暫定対応）を返す。`,
  { label: 'implement', phase: 'Implement' },
)

phase('Verify')
const [build, review, coverage] = await parallel([
  () =>
    agent(
      `次を実行して結果を報告する:
- cd packages/ui && npx tsc --noEmit
- （アプリ側を変更したなら）cd apps/beatfolio && npx tsc --noEmit
自分の diff（git status）に含まれるファイルのエラーだけを失敗として扱い、既存の無関係エラー（.jpeg の型宣言不足等）は切り分ける。`,
      { label: 'verify:build', phase: 'Verify', schema: BUILD_SCHEMA },
    ),
  () =>
    agent(
      `git diff（作業ブランチの変更）をフロントエンド規約に照らして敵対的にレビューする。
特に: アドホックカラー（neutral トークンを使っていないか）/ atom に構造スタイル(padding/flex 等)を足していないか / RHF を molecule 以下に持ち込んでいないか / "use client" が ClientAdapter 以外にないか / packages/ui に next/* 依存が無いか / story の description に実装詳細(Tailwind列挙)が無いか / a11y(label と入力の紐付け)。
確証のある指摘のみ findings に挙げる。`,
      { label: 'verify:review', phase: 'Verify', schema: REVIEW_SCHEMA },
    ),
  () =>
    agent(
      `作業ブランチの diff にある新規/変更コンポーネントを列挙し、描画系(atom/molecule/organism)にそれぞれ index.stories.tsx があるかを判定する。
primitives・app(page/adapter)・hook は story 対象外（isRenderable=false）。
描画系なのに story が無いものを missingStories に挙げる。`,
      { label: 'verify:stories', phase: 'Verify', schema: COVERAGE_SCHEMA },
    ),
])

const verdict = {
  typecheck: build.typecheckPass,
  highFindings: (review.findings || []).filter((f) => f.severity === 'high'),
  missingStories: coverage.missingStories || [],
}
log(
  `検証: tsc=${verdict.typecheck} / high指摘 ${verdict.highFindings.length} / story未整備 ${verdict.missingStories.length}`,
)

return { feature, plan, implReport, build, review, coverage, verdict }
