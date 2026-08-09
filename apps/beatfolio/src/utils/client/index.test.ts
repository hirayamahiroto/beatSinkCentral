import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Hono } from "hono";
import { createApiServerClient } from "./index";
import { isUpstreamUnavailableError } from "./errors/upstreamUnavailable";
import { handleBffError } from "../../errorMap";

vi.mock("../config", () => ({
  apiServerConfig: { baseUrl: "http://api-server.test" },
  beatfolioBffConfig: { baseUrl: "http://beatfolio.test" },
}));

describe("createApiServerClient", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("接続に失敗したら UpstreamUnavailableError を throw する", async () => {
    const cause = new TypeError("fetch failed");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(cause));

    const error = await createApiServerClient()
      .api.users.me.$get()
      .catch((e: unknown) => e);

    expect(isUpstreamUnavailableError(error)).toBe(true);
    expect((error as Error).cause).toBe(cause);
  });

  it("エラーステータスは throw せず Response のまま返す", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ error: "Internal" }, { status: 500 }),
        ),
    );

    const res = await createApiServerClient().api.users.me.$get();

    expect(res.ok).toBe(false);
    expect(res.status).toBe(500);
  });

  it("成功応答はそのまま返す", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ registered: false })),
    );

    const res = await createApiServerClient().api.users.me.$get();

    expect(res.ok).toBe(true);
    expect(await res.json()).toStrictEqual({ registered: false });
  });

  it("onError と組み合わせると route 無修正で 502 になる", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("fetch failed")),
    );

    const app = new Hono()
      .get("/", async (c) => {
        const res = await createApiServerClient().api.users.me.$get();
        if (!res.ok) {
          return c.json({ error: "Failed to fetch" }, 502);
        }
        return c.json(await res.json());
      })
      .onError(handleBffError);

    const res = await app.request("/");

    expect(res.status).toBe(502);
    expect(await res.json()).toStrictEqual({
      error: "Upstream request failed",
    });
  });
});
