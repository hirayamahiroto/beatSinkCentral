import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { requestContextMiddleware } from "./index";
import {
  getRequestContext,
  type RequestContext,
} from "../../utils/requestContext";

const TRACE_ID = "4bf92f3577b34da6a3ce929d0e0e4736";
const SPAN_ID = "00f067aa0ba902b7";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const contextOf = async (headers: Record<string, string>) => {
  let seen: RequestContext | undefined;
  const app = new Hono().use("*", requestContextMiddleware).get("/", (c) => {
    seen = getRequestContext();
    return c.json({ ok: true });
  });

  await app.request("/", { headers });

  return seen;
};

describe("requestContextMiddleware", () => {
  it("x-request-id があればそれを requestId に使う", async () => {
    expect(
      await contextOf({
        "x-request-id": "from-proxy",
        "x-vercel-id": "from-vercel",
      }),
    ).toStrictEqual({ requestId: "from-proxy" });
  });

  it("x-request-id が無ければ x-vercel-id を使う", async () => {
    expect(await contextOf({ "x-vercel-id": "from-vercel" })).toStrictEqual({
      requestId: "from-vercel",
    });
  });

  it("x-request-id が空文字なら x-vercel-id を使う", async () => {
    expect(
      await contextOf({ "x-request-id": "", "x-vercel-id": "from-vercel" }),
    ).toStrictEqual({ requestId: "from-vercel" });
  });

  it("相関ヘッダがどちらも空文字なら requestId を生成する", async () => {
    const context = await contextOf({ "x-request-id": "", "x-vercel-id": "" });

    expect(context?.requestId).toMatch(UUID_PATTERN);
  });

  it("相関ヘッダが無いリクエストでも requestId を生成する", async () => {
    const context = await contextOf({});

    expect(context?.requestId).toMatch(UUID_PATTERN);
    expect(context).not.toHaveProperty("traceId");
  });

  it("生成する requestId はリクエストごとに異なる", async () => {
    const first = await contextOf({});
    const second = await contextOf({});

    expect(first?.requestId).not.toBe(second?.requestId);
  });

  it("traceparent があれば traceId を載せる", async () => {
    expect(
      await contextOf({
        "x-request-id": "req-1",
        traceparent: `00-${TRACE_ID}-${SPAN_ID}-01`,
      }),
    ).toStrictEqual({ requestId: "req-1", traceId: TRACE_ID });
  });

  it("traceparent が無効な場合は traceId フィールドを持たない", async () => {
    expect(
      await contextOf({ "x-request-id": "req-1", traceparent: "broken" }),
    ).toStrictEqual({ requestId: "req-1" });
  });

  it("リクエストが終わればコンテキストは残らない", async () => {
    await contextOf({ "x-request-id": "req-1" });

    expect(getRequestContext()).toBeUndefined();
  });
});
