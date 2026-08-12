import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import listLinkTypesRoute from "./index";

const mockLinkTypes = { findAll: vi.fn() };

vi.mock("../../../../../infrastructure/capabilities", () => ({
  getCapabilityDeps: () => ({
    buildPublicReadCapabilities: () => ({ linkTypes: mockLinkTypes }),
  }),
}));

const createApp = () => {
  const app = new Hono();
  app.route("/", listLinkTypesRoute);
  return app;
};

describe("GET /link-types", () => {
  beforeEach(() => vi.clearAllMocks());

  it("リンク種別マスタの一覧を返す", async () => {
    mockLinkTypes.findAll.mockResolvedValue([
      { type: "youtube", label: "YouTube" },
      { type: "x", label: "X" },
    ]);

    const res = await createApp().request("/", { method: "GET" });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      linkTypes: [
        { type: "youtube", label: "YouTube" },
        { type: "x", label: "X" },
      ],
    });
  });
});
