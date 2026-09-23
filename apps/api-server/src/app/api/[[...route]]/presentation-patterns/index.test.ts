import { describe, it, expect, vi } from "vitest";
import { Hono } from "hono";
import presentationPatternsRoute from "./index";
import { createCapabilityDepsMock } from "../../../../infrastructure/capabilities/testDoubles";

const { deps, presentationPatterns } = createCapabilityDepsMock();

vi.mock("../../../../infrastructure/capabilities", () => ({
  getCapabilityDeps: () => deps,
}));

describe("GET /presentation-patterns", () => {
  it("認証なしで表現パターンマスタを返す", async () => {
    const rows = [{ code: "interview", label: "インタビュー" }];
    presentationPatterns.findAll.mockResolvedValue(rows);
    const app = new Hono().route(
      "/presentation-patterns",
      presentationPatternsRoute,
    );

    const res = await app.request("/presentation-patterns");

    expect(res.status).toBe(200);
    expect(await res.json()).toStrictEqual({ presentationPatterns: rows });
  });
});
