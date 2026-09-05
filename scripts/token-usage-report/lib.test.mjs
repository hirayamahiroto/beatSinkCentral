import { test } from "node:test";
import assert from "node:assert/strict";
import {
  aggregate,
  classifyArea,
  classifyPhase,
  estimateCost,
  lifecycleBuckets,
  promptText,
  usageOf,
  INITIAL_IMPLEMENTATION,
  BEFORE_FIRST_REVIEW,
  renderMarkdown,
  REPORT_MARKER,
} from "./lib.mjs";

const user = (content, extra = {}) => ({
  type: "user",
  gitBranch: "feat/x",
  timestamp: "2026-09-05T10:00:00.000Z",
  message: { role: "user", content },
  ...extra,
});

const assistant = ({
  requestId,
  model = "claude-opus-5",
  usage,
  content = [],
  gitBranch = "feat/x",
}) => ({
  type: "assistant",
  gitBranch,
  requestId,
  timestamp: "2026-09-05T10:00:01.000Z",
  message: { role: "assistant", model, usage, content },
});

const usage = (input, cacheWrite, cacheRead, output, { ttl = "1h" } = {}) => ({
  input_tokens: input,
  cache_creation_input_tokens: cacheWrite,
  cache_creation: {
    ephemeral_5m_input_tokens: ttl === "5m" ? cacheWrite : 0,
    ephemeral_1h_input_tokens: ttl === "1h" ? cacheWrite : 0,
  },
  cache_read_input_tokens: cacheRead,
  output_tokens: output,
});

test("classifyPhase はツール名とコマンド内容でフェーズを判定する", () => {
  assert.equal(classifyPhase("Edit", { file_path: "a.ts" }), "実装");
  assert.equal(classifyPhase("Write", {}), "実装");
  assert.equal(classifyPhase("Read", {}), "調査");
  assert.equal(classifyPhase("Grep", {}), "調査");
  assert.equal(classifyPhase("Agent", {}), "委譲");
  assert.equal(
    classifyPhase("Bash", { command: "npm test -- --filter api-server" }),
    "検証",
  );
  assert.equal(classifyPhase("Bash", { command: "npx tsc --noEmit" }), "検証");
  assert.equal(
    classifyPhase("Bash", { command: "git diff origin/main" }),
    "調査",
  );
  assert.equal(classifyPhase("Bash", { command: "cat package.json" }), "調査");
  assert.equal(classifyPhase("Bash", { command: "git commit -m x" }), "実行");
  assert.equal(classifyPhase("Bash", {}), "実行");
  assert.equal(classifyPhase("mcp__something", {}), "その他");
});

test("classifyArea はパスから領域を取り、worktree 接頭辞より apps/packages を優先する", () => {
  assert.equal(
    classifyArea({ file_path: "/Users/me/repo/apps/api-server/src/a.ts" }),
    "apps/api-server",
  );
  assert.equal(
    classifyArea({
      file_path: "/Users/me/repo/.claude/worktrees/wt/packages/ui/src/a.tsx",
    }),
    "packages/ui",
  );
  assert.equal(
    classifyArea({ file_path: "/Users/me/repo/docs/product/design-core.md" }),
    "docs",
  );
  assert.equal(
    classifyArea({ command: "cat scripts/token-usage-report/lib.mjs" }),
    "scripts",
  );
  assert.equal(classifyArea({ command: "git status" }), "(対象なし)");
  assert.equal(classifyArea(undefined), "(対象なし)");
});

test("promptText はユーザーの指示だけを返し、tool_result とハーネス由来を除外する", () => {
  assert.equal(promptText(user("直して")), "直して");
  assert.equal(
    promptText(user([{ type: "text", text: "  進めて  " }])),
    "進めて",
  );
  assert.equal(
    promptText(
      user([{ type: "tool_result", tool_use_id: "t1", content: "ok" }]),
    ),
    null,
  );
  assert.equal(promptText(user("<command-name>/foo</command-name>")), null);
  assert.equal(
    promptText(user("<task-notification>done</task-notification>")),
    null,
  );
  assert.equal(promptText(user("<system-reminder>x</system-reminder>")), null);
  assert.equal(promptText(user("Caveat: ...")), null);
  assert.equal(promptText(user("")), null);
  assert.equal(
    promptText(assistant({ requestId: "r", usage: usage(1, 0, 0, 1) })),
    null,
  );
});

const M = 1_000_000;
const tokens = ({
  input = 0,
  cacheWrite1h = 0,
  cacheWrite5m = 0,
  cacheRead = 0,
  output = 0,
}) => ({
  input,
  cacheWrite: cacheWrite1h + cacheWrite5m,
  cacheWrite1h,
  cacheWrite5m,
  cacheRead,
  output,
});

test("usageOf は cache write を TTL 別に分ける", () => {
  assert.deepEqual(
    usageOf(
      assistant({ requestId: "r", usage: usage(2, 300, 40, 5, { ttl: "5m" }) }),
    ),
    tokens({ input: 2, cacheWrite5m: 300, cacheRead: 40, output: 5 }),
  );
  assert.deepEqual(
    usageOf(assistant({ requestId: "r", usage: usage(2, 300, 40, 5) })),
    tokens({ input: 2, cacheWrite1h: 300, cacheRead: 40, output: 5 }),
  );
  assert.equal(usageOf(user("x")), null);
});

test("estimateCost は TTL 別の cache write 単価で計算し、未登録モデルは null", () => {
  assert.equal(
    estimateCost(
      "claude-opus-5",
      tokens({ input: M, cacheWrite1h: M, cacheRead: M, output: M }),
    ),
    5 + 10 + 0.5 + 25,
  );
  assert.equal(
    estimateCost("claude-opus-5", tokens({ cacheWrite5m: M })),
    6.25,
  );
  assert.equal(
    estimateCost("claude-fable-5-1", tokens({ cacheRead: 4 * M })),
    1,
  );
  assert.equal(estimateCost("claude-unknown", tokens({ input: 1 })), null);
});

test("aggregate はブランチで絞り、requestId で usage を統合（各項目の最大値）し、ツールへ等分帰属する", () => {
  const records = [
    user("調べて"),
    assistant({
      requestId: "r1",
      usage: usage(10, 100, 1000, 50),
      content: [
        {
          type: "tool_use",
          name: "Read",
          input: { file_path: "/repo/apps/api-server/a.ts" },
        },
        { type: "tool_use", name: "Bash", input: { command: "npm test" } },
      ],
    }),
    assistant({
      requestId: "r1",
      usage: usage(10, 100, 1000, 50),
      content: [
        {
          type: "tool_use",
          name: "Edit",
          input: { file_path: "/repo/apps/api-server/a.ts" },
        },
      ],
    }),
    user("次"),
    assistant({
      requestId: "r2",
      model: "claude-sonnet-5",
      usage: usage(0, 0, 2000, 20),
      content: [{ type: "text", text: "完了" }],
    }),
    user("別ブランチ", { gitBranch: "main" }),
    assistant({
      requestId: "r3",
      gitBranch: "main",
      usage: usage(0, 0, 9999, 1),
    }),
  ];
  const report = aggregate([{ sessionId: "s1", records }], {
    branch: "feat/x",
  });

  assert.deepEqual(report.totals, {
    sessions: 1,
    prompts: 2,
    calls: 2,
    toolCalls: 3,
    contextTokens: 3110,
    outputTokens: 70,
    cost:
      (10 * 5 + 100 * 10 + 1000 * 0.5 + 50 * 25) / 1_000_000 +
      (2000 * 0.2 + 20 * 10) / 1_000_000,
    inputTokens: 10,
    cacheWriteTokens: 100,
    cacheReadTokens: 3000,
    unpricedCalls: 0,
  });

  const r1Cost = (10 * 5 + 100 * 10 + 1000 * 0.5 + 50 * 25) / 1_000_000;
  const r2Cost = (2000 * 0.2 + 20 * 10) / 1_000_000;
  assert.deepEqual(report.byPhase, [
    {
      key: "応答のみ",
      calls: 1,
      toolCalls: 0,
      contextTokens: 2000,
      outputTokens: 20,
      cost: r2Cost,
    },
    {
      key: "調査",
      calls: 1 / 3,
      toolCalls: 1,
      contextTokens: 1110 / 3,
      outputTokens: 50 / 3,
      cost: r1Cost / 3,
    },
    {
      key: "検証",
      calls: 1 / 3,
      toolCalls: 1,
      contextTokens: 1110 / 3,
      outputTokens: 50 / 3,
      cost: r1Cost / 3,
    },
    {
      key: "実装",
      calls: 1 / 3,
      toolCalls: 1,
      contextTokens: 1110 / 3,
      outputTokens: 50 / 3,
      cost: r1Cost / 3,
    },
  ]);
  assert.deepEqual(report.byArea, [
    {
      key: "apps/api-server",
      calls: 2 / 3,
      toolCalls: 2,
      contextTokens: (1110 / 3) * 2,
      outputTokens: (50 / 3) * 2,
      cost: (r1Cost / 3) * 2,
    },
    {
      key: "(対象なし)",
      calls: 1 / 3,
      toolCalls: 1,
      contextTokens: 1110 / 3,
      outputTokens: 50 / 3,
      cost: r1Cost / 3,
    },
  ]);
  assert.deepEqual(
    report.byModel.map((row) => [row.key, row.calls, row.contextTokens]),
    [
      ["claude-sonnet-5", 1, 2000],
      ["claude-opus-5", 1, 1110],
    ],
  );
  assert.deepEqual(
    report.turns.map((turn) => ({
      index: turn.index,
      text: turn.text,
      calls: turn.calls,
      toolCalls: turn.toolCalls,
      contextTokens: turn.contextTokens,
      outputTokens: turn.outputTokens,
    })),
    [
      {
        index: 2,
        text: "次",
        calls: 1,
        toolCalls: 0,
        contextTokens: 2000,
        outputTokens: 20,
      },
      {
        index: 1,
        text: "調べて",
        calls: 1,
        toolCalls: 3,
        contextTokens: 1110,
        outputTokens: 50,
      },
    ],
  );
});

test("aggregate は branch 未指定なら全ブランチを対象にし、未登録モデルを数える", () => {
  const records = [
    user("a"),
    assistant({
      requestId: "r1",
      model: "claude-legacy",
      usage: usage(1, 0, 0, 1),
    }),
  ];
  const report = aggregate([{ sessionId: "s1", records }]);
  assert.equal(report.branch, null);
  assert.equal(report.totals.calls, 1);
  assert.equal(report.totals.unpricedCalls, 1);
  assert.equal(report.totals.cost, 0);
});

test("renderMarkdown はマーカーで始まり、既定では指示文を含めない", () => {
  const records = [
    user("秘密の指示文"),
    assistant({
      requestId: "r1",
      usage: usage(0, 0, 100_000, 500),
      content: [
        {
          type: "tool_use",
          name: "Edit",
          input: { file_path: "apps/beatfolio/x.ts" },
        },
      ],
    }),
  ];
  const report = aggregate([{ sessionId: "s1", records }], {
    branch: "feat/x",
  });
  const hidden = renderMarkdown(report, { changedLines: 10 });
  assert.ok(
    hidden.startsWith(
      `${REPORT_MARKER}\n## Claude Code トークン使用量 — \`feat/x\``,
    ),
  );
  assert.ok(!hidden.includes("秘密の指示文"));
  assert.ok(
    hidden.includes(
      "| 1 | 1 | 1 | 1 | 100k | 100k (100%) | 1k | $0.06 | 10k |",
    ),
  );
  assert.ok(hidden.includes("| 実装 | 1 | 100k | 100% | 1k | $0.06 |"));
  assert.ok(
    hidden.includes("| apps/beatfolio | 1 | 100k | 100% | 1k | $0.06 |"),
  );

  const shown = renderMarkdown(report, {
    changedLines: 0,
    includePrompts: true,
  });
  assert.ok(shown.includes("秘密の指示文"));
  assert.ok(shown.includes("| n/a |"));
});

test("lifecycleBuckets は PR 作成時刻とレビュー時刻で指示を区間に振り分け、10 分以内のレビューは 1 ラウンドにまとめる", () => {
  const turn = (timestamp, contextTokens) => ({
    timestamp,
    calls: 1,
    toolCalls: 2,
    contextTokens,
    outputTokens: 10,
    cost: 0.5,
  });
  const buckets = lifecycleBuckets(
    [
      turn("2026-08-19T10:00:00.000Z", 100),
      turn("2026-08-20T01:00:00.000Z", 200),
      turn("2026-08-20T02:00:00.000Z", 400),
      turn("2026-08-23T12:00:00.000Z", 800),
      { ...turn(null, 9999), timestamp: null },
    ],
    {
      createdAt: "2026-08-20T00:40:46Z",
      reviews: [
        { at: "2026-08-23T11:39:49Z", by: "reviewer-b" },
        { at: "2026-08-20T01:13:05Z", by: "reviewer-a" },
        { at: "2026-08-23T11:41:00Z", by: "reviewer-c" },
        { at: "2026-08-23T11:42:00Z", by: "reviewer-b" },
      ],
    },
  );
  assert.deepEqual(
    buckets.map(
      ({
        label,
        from,
        prompts,
        calls,
        toolCalls,
        contextTokens,
        outputTokens,
        cost,
      }) => ({
        label,
        from,
        prompts,
        calls,
        toolCalls,
        contextTokens,
        outputTokens,
        cost,
      }),
    ),
    [
      {
        label: INITIAL_IMPLEMENTATION,
        from: null,
        prompts: 1,
        calls: 1,
        toolCalls: 2,
        contextTokens: 100,
        outputTokens: 10,
        cost: 0.5,
      },
      {
        label: BEFORE_FIRST_REVIEW,
        from: "2026-08-20T00:40:46Z",
        prompts: 1,
        calls: 1,
        toolCalls: 2,
        contextTokens: 200,
        outputTokens: 10,
        cost: 0.5,
      },
      {
        label: "修正 1（レビュー: reviewer-a）",
        from: "2026-08-20T01:13:05Z",
        prompts: 1,
        calls: 1,
        toolCalls: 2,
        contextTokens: 400,
        outputTokens: 10,
        cost: 0.5,
      },
      {
        label: "修正 2（レビュー: reviewer-b, reviewer-c）",
        from: "2026-08-23T11:39:49Z",
        prompts: 1,
        calls: 1,
        toolCalls: 2,
        contextTokens: 800,
        outputTokens: 10,
        cost: 0.5,
      },
    ],
  );
});

test("renderMarkdown は lifecycle が渡されたときだけライフサイクル別の表を出す", () => {
  const records = [
    user("最初", { timestamp: "2026-08-19T10:00:00.000Z" }),
    assistant({ requestId: "r1", usage: usage(0, 0, 100_000, 100) }),
    user("修正", { timestamp: "2026-08-21T10:00:00.000Z" }),
    assistant({ requestId: "r2", usage: usage(0, 0, 300_000, 100) }),
  ];
  const report = aggregate([{ sessionId: "s1", records }], {
    branch: "feat/x",
  });
  const without = renderMarkdown(report);
  assert.ok(!without.includes("### PR ライフサイクル別"));

  const withLifecycle = renderMarkdown(report, {
    lifecycle: {
      createdAt: "2026-08-20T00:00:00Z",
      reviews: [{ at: "2026-08-20T12:00:00Z", by: "rev" }],
    },
  });
  assert.ok(withLifecycle.includes("### PR ライフサイクル別"));
  assert.ok(
    withLifecycle.includes(
      "初回実装 25% / PR 作成後の対応 75%（入力総量ベース）",
    ),
  );
  assert.ok(
    withLifecycle.includes(
      `| ${INITIAL_IMPLEMENTATION} |  | 1 | 1 | 100k | 25% |`,
    ),
  );
  assert.ok(!withLifecycle.includes(BEFORE_FIRST_REVIEW));
  assert.ok(
    withLifecycle.includes(
      "| 修正 1（レビュー: rev） | 2026-08-20 12:00 | 1 | 1 | 300k | 75% |",
    ),
  );
});
