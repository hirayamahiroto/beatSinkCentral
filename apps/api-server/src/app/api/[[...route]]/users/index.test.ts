import { describe, it, expect, vi } from "vitest";
import { Hono } from "hono";
import users from "./index";
import { handleAppError } from "../../../../errorMap";

vi.mock("../../../../infrastructure/auth0", () => ({
  auth0: { getSession: vi.fn(async () => null) },
}));

const createApp = () =>
  new Hono().route("/users", users).onError(handleAppError);

const routeSurface = () => [
  ...new Set(users.routes.map((route) => `${route.method} ${route.path}`)),
];

describe("/users ルーターの合成", () => {
  it("配下のエンドポイントを実 URL として公開する", () => {
    expect(routeSurface()).toEqual([
      "ALL /*",
      "POST /",
      "GET /me",
      "POST /:userId",
    ]);
  });

  it.each([
    ["POST", "/users"],
    ["GET", "/users/me"],
    ["POST", "/users/user-1"],
  ])("%s %s は認証を要求する", async (method, path) => {
    const res = await createApp().request(path, {
      method,
      headers: { "content-type": "application/json" },
      body: method === "POST" ? "{}" : undefined,
    });

    expect(res.status).toBe(401);
  });
});
