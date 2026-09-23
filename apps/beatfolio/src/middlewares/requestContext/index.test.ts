import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import type { createApiServerClient } from "../../utils/client";
import { requestContextMiddleware, type RequestContextEnv } from "./index";

const apiServerClient = { api: {} };
const createApiServerClientMock =
  vi.fn<(options?: Parameters<typeof createApiServerClient>[0]) => unknown>();

vi.mock("../../utils/client", () => ({
  createApiServerClient: (
    options?: Parameters<typeof createApiServerClient>[0],
  ) => createApiServerClientMock(options),
}));

const createApp = () =>
  new Hono<RequestContextEnv>()
    .use("*", requestContextMiddleware)
    .get("/", (c) =>
      c.json({ isInjected: c.get("apiClient") === apiServerClient }),
    );

describe("requestContextMiddleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createApiServerClientMock.mockReturnValue(apiServerClient);
  });

  it("リクエストの cookie と user-agent を渡して作った api-server クライアントを apiClient に載せる", async () => {
    const res = await createApp().request("/", {
      headers: { cookie: "appSession=abc", "user-agent": "Mozilla/5.0" },
    });

    expect(await res.json()).toStrictEqual({ isInjected: true });
    expect(createApiServerClientMock).toHaveBeenCalledExactlyOnceWith({
      cookie: "appSession=abc",
      userAgent: "Mozilla/5.0",
    });
  });

  it("ヘッダが無ければ undefined のまま渡す", async () => {
    await createApp().request("/");

    expect(createApiServerClientMock).toHaveBeenCalledExactlyOnceWith({
      cookie: undefined,
      userAgent: undefined,
    });
  });
});
