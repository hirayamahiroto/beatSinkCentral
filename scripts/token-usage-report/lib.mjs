export const PRICE_PER_MTOK = {
  "claude-fable-5-1": { input: 10, output: 50, cacheRead: 0.25 },
  "claude-fable-5": { input: 10, output: 50, cacheRead: 1 },
  "claude-opus-5": { input: 5, output: 25, cacheRead: 0.5 },
  "claude-sonnet-5": { input: 2, output: 10, cacheRead: 0.2 },
  "claude-haiku-4-5": { input: 1, output: 5, cacheRead: 0.1 },
};
const CACHE_WRITE_5M_MULTIPLIER = 1.25;
const CACHE_WRITE_1H_MULTIPLIER = 2;

const INVESTIGATION_TOOLS = new Set([
  "Read",
  "Grep",
  "Glob",
  "LS",
  "WebFetch",
  "WebSearch",
  "ToolSearch",
]);
const IMPLEMENTATION_TOOLS = new Set([
  "Edit",
  "Write",
  "MultiEdit",
  "NotebookEdit",
]);
const DELEGATION_TOOLS = new Set(["Agent", "Task", "Workflow"]);
const VERIFY_COMMAND =
  /\b(vitest|jest|tsc|eslint|prettier|npm (run )?(test|lint|build|format)|npx (vitest|tsc|eslint|prettier)|turbo run (test|lint|build))\b/;
const INSPECT_COMMAND =
  /^\s*(cat|ls|head|tail|sed -n|grep|rg|find|wc|tree|git (log|diff|status|show|blame|branch)|gh (pr view|pr list|pr diff|api|issue view|repo view))\b/;
const AREA_PATTERN =
  /(?:^|[\s/"'`(=])((?:apps|packages)\/[\w.-]+|docs|scripts|\.claude)(?=[/\s"'`):]|$)/g;

const HARNESS_PROMPT =
  /^<(command-name|command-message|local-command|system-reminder|task-notification)/;

export const PHASES = [
  "調査",
  "実装",
  "検証",
  "実行",
  "委譲",
  "その他",
  "応答のみ",
];

export function classifyPhase(name, input) {
  if (IMPLEMENTATION_TOOLS.has(name)) return "実装";
  if (INVESTIGATION_TOOLS.has(name)) return "調査";
  if (DELEGATION_TOOLS.has(name)) return "委譲";
  if (name === "Bash") {
    const command = typeof input?.command === "string" ? input.command : "";
    if (VERIFY_COMMAND.test(command)) return "検証";
    if (INSPECT_COMMAND.test(command)) return "調査";
    return "実行";
  }
  return "その他";
}

export function classifyArea(input) {
  const text = [
    input?.file_path,
    input?.path,
    input?.command,
    input?.pattern,
    input?.prompt,
  ]
    .filter((value) => typeof value === "string")
    .join(" ");
  const matches = [...text.matchAll(AREA_PATTERN)].map((match) => match[1]);
  if (matches.length === 0) return "(対象なし)";
  const codeArea = matches.find(
    (area) => area.startsWith("apps/") || area.startsWith("packages/"),
  );
  return codeArea ?? matches[0];
}

export function promptText(record) {
  if (record.type !== "user") return null;
  const content = record.message?.content;
  let text;
  if (typeof content === "string") {
    text = content;
  } else if (Array.isArray(content)) {
    if (content.some((block) => block?.type === "tool_result")) return null;
    text = content
      .filter((block) => block?.type === "text")
      .map((block) => block.text)
      .join(" ");
  } else {
    return null;
  }
  const trimmed = text.trim();
  if (
    trimmed === "" ||
    HARNESS_PROMPT.test(trimmed) ||
    trimmed.startsWith("Caveat:")
  )
    return null;
  return trimmed;
}

export function usageOf(record) {
  const usage = record.message?.usage;
  if (!usage) return null;
  const cacheWrite = usage.cache_creation_input_tokens ?? 0;
  const cacheWrite1h = usage.cache_creation?.ephemeral_1h_input_tokens ?? 0;
  return {
    input: usage.input_tokens ?? 0,
    cacheWrite,
    cacheWrite1h,
    cacheWrite5m: cacheWrite - cacheWrite1h,
    cacheRead: usage.cache_read_input_tokens ?? 0,
    output: usage.output_tokens ?? 0,
  };
}

export function mergeUsage(first, second) {
  return Object.fromEntries(
    Object.keys(first).map((key) => [key, Math.max(first[key], second[key])]),
  );
}

export function estimateCost(model, usage) {
  const price = PRICE_PER_MTOK[model];
  if (!price) return null;
  return (
    (usage.input * price.input +
      usage.cacheWrite5m * price.input * CACHE_WRITE_5M_MULTIPLIER +
      usage.cacheWrite1h * price.input * CACHE_WRITE_1H_MULTIPLIER +
      usage.cacheRead * price.cacheRead +
      usage.output * price.output) /
    1_000_000
  );
}

function contextTokens(usage) {
  return usage.input + usage.cacheWrite + usage.cacheRead;
}

function emptyBucket() {
  return { calls: 0, toolCalls: 0, contextTokens: 0, outputTokens: 0, cost: 0 };
}

function addTo(
  map,
  key,
  { calls = 0, toolCalls = 0, contextTokens = 0, outputTokens = 0, cost = 0 },
) {
  const bucket = map.get(key) ?? emptyBucket();
  bucket.calls += calls;
  bucket.toolCalls += toolCalls;
  bucket.contextTokens += contextTokens;
  bucket.outputTokens += outputTokens;
  bucket.cost += cost;
  map.set(key, bucket);
}

function collectCalls(records, branch) {
  const calls = new Map();
  const turns = [];
  let currentTurn = null;
  for (const record of records) {
    if (branch !== null && record.gitBranch !== branch) continue;
    const prompt = promptText(record);
    if (prompt !== null) {
      currentTurn = {
        index: turns.length + 1,
        timestamp: record.timestamp ?? null,
        text: prompt,
      };
      turns.push(currentTurn);
      continue;
    }
    if (record.type !== "assistant") continue;
    const requestId = record.requestId ?? record.uuid;
    const toolUses = (record.message?.content ?? [])
      .filter((block) => block?.type === "tool_use")
      .map((block) => ({
        name: block.name,
        phase: classifyPhase(block.name, block.input),
        area: classifyArea(block.input),
      }));
    const usage = usageOf(record);
    const existing = calls.get(requestId);
    if (existing) {
      existing.toolUses.push(...toolUses);
      if (usage) existing.usage = mergeUsage(existing.usage, usage);
      continue;
    }
    if (!usage) continue;
    calls.set(requestId, {
      model: record.message?.model ?? "(unknown)",
      usage,
      toolUses,
      turnIndex: currentTurn ? currentTurn.index : 0,
    });
  }
  return { calls: [...calls.values()], turns };
}

export function aggregate(sessions, { branch = null } = {}) {
  const totals = { sessions: 0, prompts: 0, ...emptyBucket() };
  totals.inputTokens = 0;
  totals.cacheWriteTokens = 0;
  totals.cacheReadTokens = 0;
  totals.unpricedCalls = 0;
  const byModel = new Map();
  const byPhase = new Map();
  const byArea = new Map();
  const byTool = new Map();
  const turns = [];

  for (const session of sessions) {
    const { calls, turns: sessionTurns } = collectCalls(
      session.records,
      branch,
    );
    if (calls.length === 0 && sessionTurns.length === 0) continue;
    totals.sessions += 1;
    const turnStats = new Map(
      sessionTurns.map((turn) => [turn.index, { ...turn, ...emptyBucket() }]),
    );
    for (const call of calls) {
      const context = contextTokens(call.usage);
      const cost = estimateCost(call.model, call.usage);
      if (cost === null) totals.unpricedCalls += 1;
      const costValue = cost ?? 0;
      const toolCalls = call.toolUses.length;
      const stats = {
        calls: 1,
        toolCalls,
        contextTokens: context,
        outputTokens: call.usage.output,
        cost: costValue,
      };

      totals.calls += 1;
      totals.toolCalls += toolCalls;
      totals.contextTokens += context;
      totals.outputTokens += call.usage.output;
      totals.cost += costValue;
      totals.inputTokens += call.usage.input;
      totals.cacheWriteTokens += call.usage.cacheWrite;
      totals.cacheReadTokens += call.usage.cacheRead;

      addTo(byModel, call.model, stats);
      const turn = turnStats.get(call.turnIndex);
      if (turn) addTo(turnStats, call.turnIndex, stats);

      if (toolCalls === 0) {
        addTo(byPhase, "応答のみ", stats);
        continue;
      }
      const share = {
        calls: 1 / toolCalls,
        toolCalls: 1,
        contextTokens: context / toolCalls,
        outputTokens: call.usage.output / toolCalls,
        cost: costValue / toolCalls,
      };
      for (const toolUse of call.toolUses) {
        addTo(byPhase, toolUse.phase, share);
        addTo(byArea, toolUse.area, share);
        addTo(byTool, toolUse.name, share);
      }
    }
    totals.prompts += sessionTurns.length;
    turns.push(...turnStats.values());
  }

  const toRows = (map) =>
    [...map.entries()]
      .map(([key, bucket]) => ({ key, ...bucket }))
      .sort((a, b) => b.contextTokens - a.contextTokens);

  return {
    branch,
    totals,
    byModel: toRows(byModel),
    byPhase: toRows(byPhase),
    byArea: toRows(byArea),
    byTool: toRows(byTool),
    turns: turns.sort((a, b) => b.contextTokens - a.contextTokens),
  };
}

export const REPORT_MARKER = "<!-- token-usage-report -->";

const kilo = (n) => `${Math.round(n / 1000).toLocaleString("en-US")}k`;
const dollars = (n) => `$${n.toFixed(2)}`;
const percent = (part, whole) =>
  whole === 0 ? "0%" : `${Math.round((100 * part) / whole)}%`;

function table(headers, rows) {
  const line = (cells) => `| ${cells.join(" | ")} |`;
  return [
    line(headers),
    line(headers.map(() => "---")),
    ...rows.map(line),
  ].join("\n");
}

function bucketRows(rows, totals, labelHeader) {
  return table(
    [labelHeader, "ツール実行", "入力総量", "割合", "出力", "概算額"],
    rows.map((row) => [
      row.key,
      Math.round(row.toolCalls).toString(),
      kilo(row.contextTokens),
      percent(row.contextTokens, totals.contextTokens),
      kilo(row.outputTokens),
      dollars(row.cost),
    ]),
  );
}

export function renderMarkdown(
  report,
  { changedLines = null, includePrompts = false, topTurns = 10 } = {},
) {
  const { totals } = report;
  const perLine =
    changedLines === null || changedLines === 0
      ? "n/a"
      : kilo(totals.contextTokens / changedLines);
  const lines = [
    REPORT_MARKER,
    `## Claude Code トークン使用量 — \`${report.branch ?? "(all branches)"}\``,
    "",
    table(
      [
        "セッション",
        "指示",
        "API呼出",
        "ツール実行",
        "入力総量",
        "うちcache read",
        "出力",
        "概算額",
        "変更1行あたり",
      ],
      [
        [
          totals.sessions,
          totals.prompts,
          totals.calls,
          totals.toolCalls,
          kilo(totals.contextTokens),
          `${kilo(totals.cacheReadTokens)} (${percent(totals.cacheReadTokens, totals.contextTokens)})`,
          kilo(totals.outputTokens),
          dollars(totals.cost),
          perLine,
        ].map(String),
      ],
    ),
    "",
    "### フェーズ別",
    "",
    bucketRows(report.byPhase, totals, "フェーズ"),
    "",
    "### 対象領域別",
    "",
    bucketRows(report.byArea, totals, "領域"),
    "",
    "### モデル別",
    "",
    table(
      ["モデル", "API呼出", "入力総量", "出力", "概算額"],
      report.byModel.map((row) => [
        row.key,
        row.calls.toString(),
        kilo(row.contextTokens),
        kilo(row.outputTokens),
        dollars(row.cost),
      ]),
    ),
    "",
    `### 指示別 上位 ${topTurns}`,
    "",
    table(
      [
        "#",
        "日時",
        "API呼出",
        "ツール実行",
        "入力総量",
        "出力",
        "概算額",
        ...(includePrompts ? ["指示"] : []),
      ],
      report.turns
        .slice(0, topTurns)
        .map((turn) => [
          turn.index.toString(),
          (turn.timestamp ?? "").slice(0, 16).replace("T", " "),
          turn.calls.toString(),
          turn.toolCalls.toString(),
          kilo(turn.contextTokens),
          kilo(turn.outputTokens),
          dollars(turn.cost),
          ...(includePrompts
            ? [turn.text.slice(0, 60).replace(/\|/g, "／").replace(/\s+/g, " ")]
            : []),
        ]),
    ),
    "",
    "<details><summary>集計方法</summary>",
    "",
    "- 入力総量 = input + cache write + cache read。ツール実行を含む API 呼出のトークンを、その呼出内のツールに等分して各フェーズ・領域へ帰属させる（近似）。",
    "- 概算額は Claude API 公開単価による API 相当額。cache write は TTL 5m で入力単価の 1.25 倍、1h で 2 倍。cache read は 0.1 倍（Fable 5.1 は $0.25/MTok）。",
    totals.unpricedCalls > 0
      ? `- 単価未登録のモデルによる呼出が ${totals.unpricedCalls} 件あり、概算額に含まれない。`
      : null,
    "- 指示文は既定で非表示（`--include-prompts` で表示）。",
    "",
    "</details>",
  ].filter((line) => line !== null);
  return lines.join("\n");
}
