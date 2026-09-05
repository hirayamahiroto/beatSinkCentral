import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Hono } from "hono";
import { handleBffError } from "./index";
import { createUpstreamUnavailableError } from "../utils/client/errors/upstreamUnavailable";
import { createUpstreamServerError } from "../app/api/[[...route]]/errors/upstreamServerError";
import { createUpstreamContractViolationError } from "../app/api/[[...route]]/errors/upstreamContractViolation";
import { createUpstreamRejectedError } from "../app/api/[[...route]]/errors/upstreamRejected";
import { createInvalidRequestFormatError } from "../app/api/[[...route]]/errors/invalidRequestFormat";
import { createMyUserNotFoundError } from "../app/api/[[...route]]/errors/myUserNotFound";
import { createMyArtistNotFoundError } from "../app/api/[[...route]]/errors/myArtistNotFound";
import { createPlayerNotFoundError } from "../app/api/[[...route]]/errors/playerNotFound";
import { createPartialSaveFailedError } from "../app/api/[[...route]]/errors/partialSaveFailed";

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
      code: "UpstreamUnavailableError",
    });
  });

  it("上流の 5xx を 502 へマップし、上流のボディを返さない", async () => {
    const res = await createApp(createUpstreamServerError(503)).request("/");

    expect(res.status).toBe(502);
    expect(await res.json()).toStrictEqual({
      error: "Upstream request failed",
      code: "UpstreamServerError",
    });
  });

  it("上流の契約違反を 502 へマップし error でログする", async () => {
    const res = await createApp(
      createUpstreamContractViolationError({
        upstreamStatus: 409,
        reason: "error body without code",
      }),
    ).request("/");

    expect(res.status).toBe(502);
    expect(await res.json()).toStrictEqual({
      error: "Upstream response violated contract",
      code: "UpstreamContractViolationError",
    });
    expect(console.error).toHaveBeenCalledWith(
      "[BffError]",
      expect.objectContaining({ type: "UpstreamContractViolationError" }),
    );
  });

  it("上流の 4xx はステータスとボディを透過する", async () => {
    const res = await createApp(
      createUpstreamRejectedError({
        status: 409,
        body: {
          error: "Handle already taken",
          code: "HandleAlreadyTakenError",
          details: { handle: "taken_id" },
        },
      }),
    ).request("/");

    expect(res.status).toBe(409);
    expect(await res.json()).toStrictEqual({
      error: "Handle already taken",
      code: "HandleAlreadyTakenError",
      details: { handle: "taken_id" },
    });
  });

  it("上流の ProfileNotPublishableError は不足項目を表示ラベルへ解決して返す", async () => {
    const res = await createApp(
      createUpstreamRejectedError({
        status: 422,
        body: {
          error: "Profile is not publishable",
          code: "ProfileNotPublishableError",
          details: { missingFields: ["imageUrl"] },
        },
      }),
    ).request("/");

    expect(res.status).toBe(422);
    expect(await res.json()).toStrictEqual({
      error: "Profile is not publishable",
      code: "ProfileNotPublishableError",
      missingRequirements: ["アーティスト写真"],
    });
  });

  it("リクエスト形式エラーを 400 と issues にマップする", async () => {
    const res = await createApp(
      createInvalidRequestFormatError([
        { code: "custom", path: ["email"], message: "Required" },
      ]),
    ).request("/");

    expect(res.status).toBe(400);
    expect(await res.json()).toStrictEqual({
      error: "Invalid request",
      code: "InvalidRequestFormatError",
      issues: [{ code: "custom", path: ["email"], message: "Required" }],
    });
  });

  it.each([
    [createMyUserNotFoundError, "User not found", "MyUserNotFoundError"],
    [createMyArtistNotFoundError, "Artist not found", "MyArtistNotFoundError"],
    [
      createPlayerNotFoundError,
      "Player profile not found",
      "PlayerNotFoundError",
    ],
  ])(
    "セッション主体・対象の不在を 404 にマップする",
    async (create, error, code) => {
      const res = await createApp(create()).request("/");

      expect(res.status).toBe(404);
      expect(await res.json()).toStrictEqual({ error, code });
    },
  );

  it("部分保存の失敗は上流エラーのステータス・ボディを保ち、保存済みと失敗ステップを添える", async () => {
    const res = await createApp(
      createPartialSaveFailedError({
        saved: ["attributes", "chapter:beginning"],
        failedAt: "links",
        upstream: createUpstreamRejectedError({
          status: 422,
          body: {
            error: "Invalid snsUrl format",
            code: "InvalidSnsUrlFormatError",
          },
        }),
      }),
    ).request("/");

    expect(res.status).toBe(422);
    expect(await res.json()).toStrictEqual({
      error: "Invalid snsUrl format",
      code: "InvalidSnsUrlFormatError",
      saved: ["attributes", "chapter:beginning"],
      failedAt: "links",
    });
  });

  it("部分保存の失敗が上流 5xx なら 502 に畳み、ログレベルも上流に合わせて warn にし、上流を cause に残す", async () => {
    const upstream = createUpstreamServerError(503);
    const res = await createApp(
      createPartialSaveFailedError({
        saved: ["attributes"],
        failedAt: "chapter:beginning",
        upstream,
      }),
    ).request("/");

    expect(res.status).toBe(502);
    expect(await res.json()).toStrictEqual({
      error: "Upstream request failed",
      code: "UpstreamServerError",
      saved: ["attributes"],
      failedAt: "chapter:beginning",
    });
    expect(console.warn).toHaveBeenCalledWith("[BffError]", {
      type: "PartialSaveFailedError",
      status: 502,
      cause: upstream,
    });
  });

  it("未知のエラーは 500 にし、内部情報を応答に含めない", async () => {
    const res = await createApp(
      new Error("connect ECONNREFUSED 10.0.0.1:5432"),
    ).request("/");

    expect(res.status).toBe(500);
    expect(await res.json()).toStrictEqual({ error: "Internal Server Error" });
  });

  it("Object.prototype のプロパティ名を type に持つエラーも 500 にする", async () => {
    const error = Object.assign(new Error("boom"), { type: "toString" });
    const res = await createApp(error).request("/");

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
