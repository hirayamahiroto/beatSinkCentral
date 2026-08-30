import { describe, it, expect } from "vitest";
import { readUpstreamJson } from "./index";

describe("readUpstreamJson", () => {
  it("解析できたボディをそのまま返す", async () => {
    await expect(
      readUpstreamJson({ status: 200, json: async () => ({ ok: true }) }),
    ).resolves.toStrictEqual({ ok: true });
  });

  it("解析に失敗したら UpstreamContractViolationError を投げる", async () => {
    await expect(
      readUpstreamJson({
        status: 200,
        json: async () => {
          throw new SyntaxError("Unexpected end of JSON input");
        },
      }),
    ).rejects.toMatchObject({
      type: "UpstreamContractViolationError",
      upstreamStatus: 200,
    });
  });
});
