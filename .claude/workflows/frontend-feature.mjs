export const meta = {
  name: 'frontend-feature',
  description:
    'beatfolio / packages/ui のフロントエンド UI 実装を 規範読解→計画→実装→多面検証 で進めるハーネス（Atomic Design + shadcn + デザインシステム）',
  whenToUse:
    '新しい画面 / フォーム / コンポーネントを実装するとき。args に機能概要や情報設計ドキュメントのパスを渡す。',
  phases: [
    { title: 'Norms', detail: 'product → architecture の順に規範を読み、この機能に効く規範を抽出する' },
    { title: 'Research', detail: '規範を前提に既存コンポーネントを調べ、Atomic Design 順の実装計画を作る' },
    { title: 'Implement', detail: '計画に沿って部品から実装し、各コンポーネントに story を書く' },
    { title: 'Verify', detail: 'tsc / 実装規約 / 規範整合 / story 網羅 を並行検証' },
  ],
}

// --- 構造化出力スキーマ -------------------------------------------------
const NORMS_SCHEMA = {
  type: 'object',
  required: ['productNorms', 'architectureNorms', 'openQuestions'],
  properties: {
    productNorms: {
      type: 'array',
      description: 'docs/product/ から抽出した、この機能が従うべき規範',
      items: {
        type: 'object',
        required: ['doc', 'norm', 'implication'],
        properties: {
          doc: { type: 'string', description: '出典のパス' },
          norm: { type: 'string', description: 'ドキュメントに書かれている規範そのもの' },
          implication: { type: 'string', description: 'この機能では具体的に何が決まるか' },
        },
      },
    },
    architectureNorms: {
      type: 'array',
      description: 'docs/architecture/ から抽出した、この機能が従うべき規範',
      items: {
        type: 'object',
        required: ['doc', 'norm', 'implication'],
        properties: {
          doc: { type: 'string' },
          norm: { type: 'string' },
          implication: { type: 'string' },
        },
      },
    },
    openQuestions: {
      type: 'array',
      items: { type: 'string' },
      description: '規範が存在せず、勝手に決めてはいけない設計判断（CLAUDE.md: docs 側を整える方向で相談する）',
    },
  },
}

const PLAN_SCHEMA = {
  type: 'object',
  required: ['summary', 'components', 'risks', 'appliedNorms'],
  properties: {
    summary: { type: 'string', description: '実装方針の要約' },
    appliedNorms: {
      type: 'array',
      description: '計画上の主要な判断と、その根拠にした規範の対応',
      items: {
        type: 'object',
        required: ['decision', 'basis'],
        properties: {
          decision: { type: 'string', description: '計画で決めたこと' },
          basis: { type: 'string', description: '根拠にした規範（doc パス + 内容）' },
        },
      },
    },
    docDivergences: {
      type: 'array',
      items: { type: 'string' },
      description: '設計ドキュメントと既存コードの食い違い（1件でもあれば実装に進まない）',
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
              'bff-route',
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
          checkpoint: { type: 'string' },
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

// docs/README.md が定める読む順序（product → architecture）に従う。
phase('Norms')
const norms = await agent(
  `あなたは beatfolio の設計規範を読み解く担当。次の機能に効く規範だけを抽出する。実装案は書かない。

機能: ${feature}

読む順序（docs/README.md の規定に従い、この順で読む）:
1. docs/README.md — 索引。規範は docs/product/ と docs/architecture/ のみ。
   docs/plans/ と docs/discussions/ は規範ではないので判断の根拠にしない。
2. docs/product/design-core.md — すべての設計判断の最上位。迷ったときの最終参照先。
3. docs/product/flow-design.md — 動線。どこから来てどこへ抜けるか。
4. docs/product/profile-information-design.md — 何を・どう載せ・どこで見せるか。
5. docs/architecture/frontend/routing.md — 画面 URL 設計（実体を先に置く・名詞と動詞・BFF ルート対応）。
6. docs/architecture/frontend/bff/design.md — read/write の経路と整形責務。表示語彙は BFF で解決。
7. docs/architecture/frontend/ui/component-design.md — Atomic Design・文脈の有無・"use client" 境界。
8. docs/architecture/frontend/ui/form-design.md — RHF は organism 以上。
9. docs/architecture/frontend/{state-management,ui/ui-library,ui/tailwind,ui/responsive}.md

抽出の仕方:
- productNorms / architectureNorms には「ドキュメントに実際に書かれている規範」と「この機能では何が決まるか」を対にして書く。
  一般論ではなく、出典パスと結びついた具体を書く。該当が無い観点は無理に埋めない。
- 規範が存在しない設計判断は openQuestions に入れる。勝手に決めない（CLAUDE.md: ドキュメント側を整える方向で相談する）。`,
  { label: 'norms:read', phase: 'Norms', schema: NORMS_SCHEMA, agentType: 'Explore' },
)
log(
  `規範: product ${norms.productNorms.length} 件 / architecture ${norms.architectureNorms.length} 件 / 未規定 ${norms.openQuestions.length} 件`,
)
if (norms.openQuestions.length > 0) {
  log(`⚠ 規範が無い判断が ${norms.openQuestions.length} 件。docs を整えるところから相談が必要`)
}

phase('Research')
const plan = await agent(
  `あなたは beatfolio / packages/ui の UI 設計に精通したフロントエンドアーキテクト。
前段で抽出済みの規範を**前提**として、実装計画を作る。規範の再解釈はしない。

機能: ${feature}

適用すべき規範:
${JSON.stringify(norms, null, 2)}

追加で読む（既存実装の把握）:
- packages/ui/src/design-system/components 配下の似た atom/molecule/organism
- packages/ui/global.css のカラートークン
- 変更が必要になる apps/beatfolio 側の page.tsx / ClientAdapter / BFF route

方針:
- appliedNorms に「計画で決めたこと」と「根拠にした規範（doc パス + 内容）」の対応を必ず書く。
  規範に紐づかない判断は、その旨を明示する。
- **設計ドキュメントが規範、既存コードは実装結果**。食い違う点は docDivergences に列挙し、既存へ勝手に合わせない。
- カラーは neutral dark トークン（bg-background / text-foreground / bg-primary / text-muted-foreground 等）。アドホック色は使わない。
- 不足 primitive は shadcnToAdd に列挙。
- components は Atomic Design 順（primitive→atom→molecule→organism→bff-route→app-page→app-adapter）。
- 描画する atom/molecule/organism は needsStory=true。`,
  { label: 'research:plan', phase: 'Research', schema: PLAN_SCHEMA, agentType: 'Explore' },
)
log(
  `計画: ${plan.components.length} コンポーネント / shadcn追加 ${(plan.shadcnToAdd || []).length} / リスク ${plan.risks.length}`,
)

// CLAUDE.md: 既存コードがドキュメントとズレている場合は、勝手に合わせずユーザーに方針を確認する。
// 実装フェーズに進ませず、ここで停止して判断を仰ぐ。
const divergences = plan.docDivergences || []
if (divergences.length > 0 || norms.openQuestions.length > 0) {
  log(
    `⛔ 実装を中断: ドキュメントとの食い違い ${divergences.length} 件 / 規範の無い判断 ${norms.openQuestions.length} 件。方針確認が必要`,
  )
  return {
    feature,
    stoppedBefore: 'Implement',
    reason: '設計ドキュメントとの食い違い、または規範の無い設計判断があるため、実装前にユーザー確認が必要',
    norms,
    plan,
    docDivergences: divergences,
    openQuestions: norms.openQuestions,
  }
}

phase('Implement')
const implReport = await agent(
  `beatfolio / packages/ui に「${feature}」の UI を実装する。

まず Skill ツールで skill: "frontend-feature" を呼び出し、その手順とチェックリストに従うこと。
（この指示だけでは skill の内容は読み込まれない。必ず呼び出す）

適用すべき規範:
${JSON.stringify(norms, null, 2)}

計画:
${JSON.stringify(plan, null, 2)}

実装ルールの要点（詳細は skill を参照）:
- Atomic Design 順に実装。描画する atom/molecule/organism に index.stories.tsx を必ず作る（description は責務と使い時に絞る）。
- 不足 primitive は cd packages/ui && npx shadcn@latest add <name> --yes で追加（生成物は改変しない・index.ts に export）。
- atom は primitive を薄くラップし色味のみ上書き（padding/flex/gap 等の構造スタイルを持たない）。表現は variant/tone 軸で追加。
- molecule は RHF 非依存の Controlled API（value/onChange/ref）。RHF + zod は organism 以上。register 優先・Controller は非ネイティブのみ・配列は useFieldArray。
- カラーは neutral dark トークンのみ。アドホック色禁止。
- "use client" は app の ClientAdapter のみ。packages/ui に next/* を import しない。
- データ取得は page.tsx が BFF read route を呼ぶ。表示語彙（ラベル・選択肢）は BFF で解決して props で渡す。UI に語彙を持たせない。
- 必須値を ?? "" 等で埋めない（欠落は redirect/throw で明示的に落とす）。
- **コミットはしない。** 実装/変更したファイル一覧と設計上の判断を返す。`,
  { label: 'implement', phase: 'Implement' },
)

phase('Verify')
const [build, review, normReview, coverage] = await parallel([
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
      `git diff（作業ブランチの変更）を**実装規約**に照らして敵対的にレビューする。
checkpoint は次から選ぶ:
color-token（アドホック色） / atom-structure（atom に構造スタイル） / rhf-placement（RHF を molecule 以下に） /
use-client-boundary / next-dep-in-ui（packages/ui に next/*） / story-description（実装詳細の記述） /
optional-fallback（必須値を ?? で埋めている） / a11y（label と入力の紐付け）
確証のある指摘のみ findings に挙げる。`,
      { label: 'verify:review', phase: 'Verify', schema: REVIEW_SCHEMA },
    ),
  () =>
    agent(
      `git diff（作業ブランチの変更）を**設計規範との整合**に照らしてレビューする。実装の綺麗さではなく規範違反だけを見る。

照合する規範:
${JSON.stringify(norms, null, 2)}

特に確認する:
- docs/architecture/frontend/routing.md — 画面 URL は実体起点か / 名詞 URL に編集画面を置いていないか / BFF route のパスが画面パスと一致しているか
- docs/architecture/frontend/bff/design.md — page.tsx にデータ取得と整形が散っていないか / BFF read route が画面名で切られているか / 表示語彙を UI で解決していないか
- docs/product/design-core.md — 動線・情報の出し方が最上位の設計判断と矛盾していないか

checkpoint には照合した doc のパスを書く。確証のある違反のみ挙げる。`,
      { label: 'verify:norms', phase: 'Verify', schema: REVIEW_SCHEMA },
    ),
  () =>
    agent(
      `作業ブランチの diff にある新規/変更コンポーネントを列挙し、描画系(atom/molecule/organism)にそれぞれ index.stories.tsx があるかを判定する。
primitives・app(page/adapter)・hook・BFF route は story 対象外（isRenderable=false）。
描画系なのに story が無いものを missingStories に挙げる。`,
      { label: 'verify:stories', phase: 'Verify', schema: COVERAGE_SCHEMA },
    ),
])

const highFindings = [...(review.findings || []), ...(normReview.findings || [])].filter(
  (f) => f.severity === 'high',
)
const verdict = {
  typecheck: build.typecheckPass,
  highFindings,
  normViolations: (normReview.findings || []).length,
  missingStories: coverage.missingStories || [],
}
log(
  `検証: tsc=${verdict.typecheck} / high指摘 ${highFindings.length} / 規範違反 ${verdict.normViolations} / story未整備 ${verdict.missingStories.length}`,
)

return { feature, norms, plan, implReport, build, review, normReview, coverage, verdict }
