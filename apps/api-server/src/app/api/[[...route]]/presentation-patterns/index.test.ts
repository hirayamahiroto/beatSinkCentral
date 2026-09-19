import { describe, it, expect, vi } from "vitest";
import { Hono } from "hono";
import presentationPatterns from "./index";

const findAll = vi.fn();

vi.mock("../../../../infrastructure/capabilities", () => ({
  getCapabilityDeps: () => ({
    buildPublicReadCapabilities: () => ({
      presentationPatterns: { findAll },
    }),
  }),
}));

describe("GET /presentation-patterns", () => {
  it("認証なしで表現パターンマスタを返す", async () => {
    const rows = [{ code: "interview", label: "インタビュー" }];
    findAll.mockResolvedValue(rows);
    const app = new Hono().route(
      "/presentation-patterns",
      presentationPatterns,
    );

    const res = await app.request("/presentation-patterns");

    expect(res.status).toBe(200);
    expect(await res.json()).toStrictEqual({ presentationPatterns: rows });
  });
});
