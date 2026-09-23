import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import listLinkTypesRoute from "./index";
import { createCapabilityDepsMock } from "../../../../../infrastructure/capabilities/testDoubles";

const { deps, linkTypes } = createCapabilityDepsMock();

vi.mock("../../../../../infrastructure/capabilities", () => ({
  getCapabilityDeps: () => deps,
}));

const createApp = () => {
  const app = new Hono();
  app.route("/", listLinkTypesRoute);
  return app;
};

describe("GET /link-types", () => {
  beforeEach(() => vi.clearAllMocks());

  it("リンク種別マスタの一覧を返す", async () => {
    linkTypes.findAll.mockResolvedValue([
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
