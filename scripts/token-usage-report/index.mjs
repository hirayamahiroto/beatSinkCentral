import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { aggregate, renderMarkdown, REPORT_MARKER } from "./lib.mjs";

const USAGE = `usage: node scripts/token-usage-report/index.mjs [options]
  --branch <name>      集計対象ブランチ（既定: 現在のブランチ）
  --pr <number>        PR 番号。ブランチと変更行数を PR から取得する
  --post               PR コメントとして投稿（既存レポートがあれば更新）
  --include-prompts    指示文の先頭 60 文字を表に含める（公開リポジトリでは注意）
  --top <n>            指示別の表示件数（既定: 10）
  --projects-dir <dir> トランスクリプト置き場（既定: ~/.claude/projects）`;

function parseArgs(argv) {
  const options = {
    branch: null,
    pr: null,
    post: false,
    includePrompts: false,
    top: 10,
    projectsDir: join(homedir(), ".claude", "projects"),
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = () => {
      i += 1;
      if (argv[i] === undefined)
        throw new Error(`${arg} には値が必要です\n${USAGE}`);
      return argv[i];
    };
    if (arg === "--branch") options.branch = next();
    else if (arg === "--pr") options.pr = Number(next());
    else if (arg === "--post") options.post = true;
    else if (arg === "--include-prompts") options.includePrompts = true;
    else if (arg === "--top") options.top = Number(next());
    else if (arg === "--projects-dir") options.projectsDir = next();
    else if (arg === "--help" || arg === "-h") {
      console.log(USAGE);
      process.exit(0);
    } else throw new Error(`不明な引数: ${arg}\n${USAGE}`);
  }
  return options;
}

const run = (file, args) =>
  execFileSync(file, args, { encoding: "utf8" }).trim();

function repoRoot() {
  const commonDir = run("git", [
    "rev-parse",
    "--path-format=absolute",
    "--git-common-dir",
  ]);
  return dirname(commonDir);
}

function currentBranch() {
  return run("git", ["rev-parse", "--abbrev-ref", "HEAD"]);
}

function encodeProjectDir(path) {
  return path.replace(/[^A-Za-z0-9]/g, "-");
}

function transcriptFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return transcriptFiles(path);
    return entry.name.endsWith(".jsonl") ? [path] : [];
  });
}

function loadSessions(projectsDir, root) {
  const prefix = encodeProjectDir(root);
  const sessions = [];
  for (const dir of readdirSync(projectsDir)) {
    if (!dir.startsWith(prefix)) continue;
    for (const file of transcriptFiles(join(projectsDir, dir))) {
      const records = [];
      for (const line of readFileSync(file, "utf8").split("\n")) {
        if (line === "") continue;
        try {
          records.push(JSON.parse(line));
        } catch {
          continue;
        }
      }
      sessions.push({ sessionId: basename(file, ".jsonl"), records });
    }
  }
  return sessions;
}

function pullRequest(number) {
  const json = run("gh", [
    "pr",
    "view",
    String(number),
    "--json",
    "number,headRefName,additions,deletions,url",
  ]);
  return JSON.parse(json);
}

function pullRequestForBranch(branch) {
  const json = run("gh", [
    "pr",
    "list",
    "--head",
    branch,
    "--state",
    "all",
    "--limit",
    "1",
    "--json",
    "number,headRefName,additions,deletions,url",
  ]);
  const [pr] = JSON.parse(json);
  if (!pr) throw new Error(`ブランチ ${branch} に対応する PR が見つかりません`);
  return pr;
}

function resolveRef(branch) {
  for (const ref of [branch, `origin/${branch}`]) {
    try {
      run("git", ["rev-parse", "--verify", "--quiet", `${ref}^{commit}`]);
      return ref;
    } catch {
      continue;
    }
  }
  return null;
}

function changedLinesAgainstMain(branch) {
  const ref = resolveRef(branch);
  if (ref === null) return null;
  const base = run("git", ["merge-base", "origin/main", ref]);
  const numstat = run("git", ["diff", "--numstat", base, ref]);
  return numstat
    .split("\n")
    .filter((line) => line !== "")
    .reduce((sum, line) => {
      const [added, deleted] = line.split("\t");
      return sum + (Number(added) || 0) + (Number(deleted) || 0);
    }, 0);
}

function pullRequestForBranchIfAny(branch) {
  try {
    return pullRequestForBranch(branch);
  } catch {
    return null;
  }
}

function postComment(pr, body) {
  const bodyFile = join(
    mkdtempSync(join(tmpdir(), "token-usage-report-")),
    "body.md",
  );
  writeFileSync(bodyFile, body);
  const existingIds = run("gh", [
    "api",
    `repos/{owner}/{repo}/issues/${pr.number}/comments`,
    "--paginate",
    "--jq",
    `.[] | select(.body | startswith("${REPORT_MARKER}")) | .id`,
  ]);
  const [existingId] = existingIds.split("\n").filter((id) => id !== "");
  if (existingId) {
    run("gh", [
      "api",
      "-X",
      "PATCH",
      `repos/{owner}/{repo}/issues/comments/${existingId}`,
      "-F",
      `body=@${bodyFile}`,
    ]);
    return `updated comment ${existingId} on ${pr.url}`;
  }
  run("gh", [
    "api",
    "-X",
    "POST",
    `repos/{owner}/{repo}/issues/${pr.number}/comments`,
    "-F",
    `body=@${bodyFile}`,
  ]);
  return `posted comment on ${pr.url}`;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const root = repoRoot();
  let pr = null;
  if (options.pr !== null) pr = pullRequest(options.pr);
  const branch = options.branch ?? pr?.headRefName ?? currentBranch();
  if (pr === null) {
    pr = options.post
      ? pullRequestForBranch(branch)
      : pullRequestForBranchIfAny(branch);
  }
  const changedLines = pr
    ? pr.additions + pr.deletions
    : changedLinesAgainstMain(branch);

  const sessions = loadSessions(options.projectsDir, root);
  const report = aggregate(sessions, { branch });
  const markdown = renderMarkdown(report, {
    changedLines,
    includePrompts: options.includePrompts,
    topTurns: options.top,
  });

  console.log(markdown);
  if (options.post) console.error(postComment(pr, markdown));
}

main();
