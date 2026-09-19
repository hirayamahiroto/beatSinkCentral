import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const TRIGGER_COMMAND = /\bgh\s+pr\s+create\b|\bgit\s+push\b/;

function commandFromHookInput() {
  try {
    const input = JSON.parse(readFileSync(0, "utf8"));
    return typeof input.tool_input?.command === "string"
      ? input.tool_input.command
      : "";
  } catch {
    return "";
  }
}

function failureDetail(stderr) {
  const match = /^\w*Error: (.+)$/m.exec(stderr);
  if (match) return match[1];
  const lines = stderr
    .trim()
    .split("\n")
    .filter((line) => line !== "");
  return lines.length > 0 ? lines[0] : "unknown error";
}

function main() {
  const command = commandFromHookInput();
  if (!TRIGGER_COMMAND.test(command)) return;
  const reportScript = join(
    dirname(fileURLToPath(import.meta.url)),
    "index.mjs",
  );
  const result = spawnSync("node", [reportScript, "--post"], {
    encoding: "utf8",
    stdio: ["ignore", "ignore", "pipe"],
  });
  const message =
    result.status === 0
      ? `token-report: ${result.stderr.trim()}`
      : `token-report: skipped (${failureDetail(result.stderr)})`;
  console.log(JSON.stringify({ systemMessage: message, suppressOutput: true }));
}

main();
