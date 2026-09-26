import { describe, it, expect, vi } from "vitest";
import { Hono } from "hono";
import users from "./index";
import { handleThrownError } from "../../../../errorMap";
import type { Auth0SessionModule } from "../../../../infrastructure/auth0/testDoubles";

vi.mock(
  "../../../../infrastructure/auth0",
  () =>
    ({
      getAuth0: () => ({ getSession: async () => null }),
    }) satisfies Auth0SessionModule,
);

const createApp = () =>
  new Hono().route("/users", users).onError(handleThrownError);

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
