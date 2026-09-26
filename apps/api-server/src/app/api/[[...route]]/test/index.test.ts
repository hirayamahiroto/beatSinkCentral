import { describe, it, expect, vi } from "vitest";
import { Hono } from "hono";
import test from "./index";
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
  new Hono().route("/test", test).onError(handleThrownError);

const routeSurface = () => [
  ...new Set(test.routes.map((route) => `${route.method} ${route.path}`)),
];

describe("/test ルーターの合成", () => {
  it("配下のエンドポイントを実 URL として公開する", () => {
    expect(routeSurface()).toEqual(["ALL /*", "GET /"]);
  });

  it("認証を要求する", async () => {
    const res = await createApp().request("/test", { method: "GET" });

    expect(res.status).toBe(401);
  });
});
