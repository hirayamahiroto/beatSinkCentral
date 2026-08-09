import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import {
  buildRequestContext,
  parseTraceId,
  requestContextMiddleware,
} from "./index";
import {
  getRequestContext,
  type RequestContext,
} from "../../utils/requestContext";

const TRACE_ID = "4bf92f3577b34da6a3ce929d0e0e4736";
const SPAN_ID = "00f067aa0ba902b7";

describe("parseTraceId", () => {
  it("W3C traceparent から trace-id を取り出す", () => {
    expect(parseTraceId(`00-${TRACE_ID}-${SPAN_ID}-01`)).toBe(TRACE_ID);
  });

  it("ヘッダが無い場合は undefined を返す", () => {
    expect(parseTraceId(undefined)).toBeUndefined();
  });

  it("形式が不正な場合は undefined を返す", () => {
    expect(parseTraceId("not-a-traceparent")).toBeUndefined();
    expect(parseTraceId(`00-${TRACE_ID}-${SPAN_ID}`)).toBeUndefined();
    expect(parseTraceId(`00-tooshort-${SPAN_ID}-01`)).toBeUndefined();
  });

  it("大文字は W3C 仕様外なので undefined を返す", () => {
    expect(
      parseTraceId(`00-${TRACE_ID.toUpperCase()}-${SPAN_ID}-01`),
    ).toBeUndefined();
  });

  it("全て 0 の trace-id は無効なので undefined を返す", () => {
    expect(parseTraceId(`00-${"0".repeat(32)}-${SPAN_ID}-01`)).toBeUndefined();
  });

  it("バージョン ff は W3C 仕様上無効なので undefined を返す", () => {
    expect(parseTraceId(`ff-${TRACE_ID}-${SPAN_ID}-01`)).toBeUndefined();
  });

  it("全て 0 の parent-id は無効なので undefined を返す", () => {
    expect(parseTraceId(`00-${TRACE_ID}-${"0".repeat(16)}-01`)).toBeUndefined();
  });
});

describe("buildRequestContext", () => {
  it("x-request-id があればそれを requestId に使う", () => {
    expect(
      buildRequestContext({
        requestId: "from-proxy",
        vercelId: "from-vercel",
        traceparent: undefined,
      }),
    ).toStrictEqual({ requestId: "from-proxy" });
  });

  it("x-request-id が無ければ x-vercel-id を使う", () => {
    expect(
      buildRequestContext({
        requestId: undefined,
        vercelId: "from-vercel",
        traceparent: undefined,
      }),
    ).toStrictEqual({ requestId: "from-vercel" });
  });

  it("x-request-id が空文字なら x-vercel-id を使う", () => {
    expect(
      buildRequestContext({
        requestId: "",
        vercelId: "from-vercel",
        traceparent: undefined,
      }),
    ).toStrictEqual({ requestId: "from-vercel" });
  });

  it("相関ヘッダがどちらも空文字なら requestId を生成する", () => {
    const context = buildRequestContext({
      requestId: "",
      vercelId: "",
      traceparent: undefined,
    });

    expect(context.requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it("どちらも無ければ requestId を生成する", () => {
    const context = buildRequestContext({
      requestId: undefined,
      vercelId: undefined,
      traceparent: undefined,
    });

    expect(context.requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it("生成する requestId はリクエストごとに異なる", () => {
    const headers = {
      requestId: undefined,
      vercelId: undefined,
      traceparent: undefined,
    };

    expect(buildRequestContext(headers).requestId).not.toBe(
      buildRequestContext(headers).requestId,
    );
  });

  it("traceparent があれば traceId を載せる", () => {
    expect(
      buildRequestContext({
        requestId: "req-1",
        vercelId: undefined,
        traceparent: `00-${TRACE_ID}-${SPAN_ID}-01`,
      }),
    ).toStrictEqual({ requestId: "req-1", traceId: TRACE_ID });
  });

  it("traceparent が無効な場合は traceId フィールドを持たない", () => {
    expect(
      buildRequestContext({
        requestId: "req-1",
        vercelId: undefined,
        traceparent: "broken",
      }),
    ).toStrictEqual({ requestId: "req-1" });
  });
});

describe("requestContextMiddleware", () => {
  const buildApp = (onRequest: (context: RequestContext | undefined) => void) =>
    new Hono().use("*", requestContextMiddleware).get("/", (c) => {
      onRequest(getRequestContext());
      return c.json({ ok: true });
    });

  it("ハンドラ実行中にリクエストコンテキストを参照できる", async () => {
    let seen: RequestContext | undefined;
    const app = buildApp((context) => {
      seen = context;
    });

    await app.request("/", {
      headers: {
        "x-request-id": "req-1",
        traceparent: `00-${TRACE_ID}-${SPAN_ID}-01`,
      },
    });

    expect(seen).toStrictEqual({ requestId: "req-1", traceId: TRACE_ID });
  });

  it("相関ヘッダが無いリクエストでも requestId を確定させる", async () => {
    let seen: RequestContext | undefined;
    const app = buildApp((context) => {
      seen = context;
    });

    await app.request("/");

    expect(seen?.requestId).toBeTruthy();
    expect(seen).not.toHaveProperty("traceId");
  });

  it("リクエストが終わればコンテキストは残らない", async () => {
    const app = buildApp(() => {});

    await app.request("/", { headers: { "x-request-id": "req-1" } });

    expect(getRequestContext()).toBeUndefined();
  });
});
