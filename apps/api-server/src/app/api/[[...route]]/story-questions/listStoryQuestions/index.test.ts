import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import listStoryQuestionsRoute from "./index";
import { createCapabilityDepsMock } from "../../../../../infrastructure/capabilities/testDoubles";

const { deps, storyQuestions } = createCapabilityDepsMock();

vi.mock("../../../../../infrastructure/capabilities", () => ({
  getCapabilityDeps: () => deps,
}));

const createApp = () => {
  const app = new Hono();
  app.route("/", listStoryQuestionsRoute);
  return app;
};

describe("GET /story-questions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("問いマスタの一覧を必須フラグ付きで返す", async () => {
    storyQuestions.findAll.mockResolvedValue([
      { code: "beginning", label: "始まり" },
      { code: "turning_point", label: "転機" },
    ]);

    const res = await createApp().request("/", { method: "GET" });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toStrictEqual({
      storyQuestions: [
        { code: "beginning", label: "始まり", required: true },
        { code: "turning_point", label: "転機", required: false },
      ],
    });
  });
});
