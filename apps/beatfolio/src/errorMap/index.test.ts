import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Hono } from "hono";
import { handleBffError } from "./index";
import { createUpstreamUnavailableError } from "../utils/client/errors/upstreamUnavailable";

const createApp = (thrown: unknown) => {
  const app = new Hono();
  app.get("/", () => {
    throw thrown;
  });
  app.onError(handleBffError);
  return app;
};

describe("handleBffError", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("上流に到達できないエラーを 502 へマップする", async () => {
    const res = await createApp(
      createUpstreamUnavailableError(new TypeError("fetch failed")),
    ).request("/");

    expect(res.status).toBe(502);
    expect(await res.json()).toStrictEqual({
      error: "Upstream request failed",
    });
  });

  it("未知のエラーは 500 にし、内部情報を応答に含めない", async () => {
    const res = await createApp(
      new Error("connect ECONNREFUSED 10.0.0.1:5432"),
    ).request("/");

    expect(res.status).toBe(500);
    expect(await res.json()).toStrictEqual({ error: "Internal Server Error" });
  });

  it("マップ済みエラーは warn、未知のエラーは error でログする", async () => {
    await createApp(createUpstreamUnavailableError(new Error("x"))).request(
      "/",
    );
    expect(console.warn).toHaveBeenCalledWith(
      "[BffError]",
      expect.objectContaining({
        type: "UpstreamUnavailableError",
        status: 502,
      }),
    );

    await createApp(new Error("boom")).request("/");
    expect(console.error).toHaveBeenCalledWith(
      "[Unhandled error]",
      expect.any(Error),
    );
  });
});
