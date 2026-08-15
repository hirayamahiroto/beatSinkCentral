import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { z } from "zod";
import { validateRequest } from "./index";
import { isInvalidRequestFormatError } from "../../errors/invalidRequestFormat";
import { handleAppError } from "../../../../../errorMap";

const createApp = () => {
  const captured: { error: Error | null } = { error: null };

  const app = new Hono()
    .get(
      "/items/:itemId",
      validateRequest("param", z.object({ itemId: z.string().max(5) })),
      (c) => c.json(c.req.valid("param")),
    )
    .get(
      "/items",
      validateRequest("query", z.object({ limit: z.string().regex(/^\d+$/) })),
      (c) => c.json(c.req.valid("query")),
    )
    .post(
      "/items",
      validateRequest("json", z.object({ name: z.string() })),
      (c) => c.json(c.req.valid("json")),
    )
    .onError((error, c) => {
      captured.error = error;
      return handleAppError(error, c);
    });

  return { app, captured };
};

const postJson = (body: unknown) => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

describe("validateRequest", () => {
  it("param を検証し、通過した値を valid('param') で読める", async () => {
    const { app } = createApp();

    const res = await app.request("/items/abc", { method: "GET" });

    expect(res.status).toBe(200);
    expect(await res.json()).toStrictEqual({ itemId: "abc" });
  });

  it("param の検証失敗を InvalidRequestFormatError として throw する", async () => {
    const { app, captured } = createApp();

    const res = await app.request("/items/toolong", { method: "GET" });

    expect(res.status).toBe(400);
    expect(isInvalidRequestFormatError(captured.error)).toBe(true);
    expect(await res.json()).toMatchObject({ error: "Invalid request" });
  });

  it("query を検証し、通過した値を valid('query') で読める", async () => {
    const { app } = createApp();

    const res = await app.request("/items?limit=20", { method: "GET" });

    expect(res.status).toBe(200);
    expect(await res.json()).toStrictEqual({ limit: "20" });
  });

  it("query の検証失敗を InvalidRequestFormatError として throw する", async () => {
    const { app, captured } = createApp();

    const res = await app.request("/items?limit=many", { method: "GET" });

    expect(res.status).toBe(400);
    expect(isInvalidRequestFormatError(captured.error)).toBe(true);
  });

  it("json の検証失敗を InvalidRequestFormatError として throw する", async () => {
    const { app, captured } = createApp();

    const res = await app.request("/items", postJson({ name: 1 }));

    expect(res.status).toBe(400);
    expect(isInvalidRequestFormatError(captured.error)).toBe(true);
  });

  it("検証失敗の issues を details としてクライアントへ返す", async () => {
    const { app } = createApp();

    const res = await app.request("/items", postJson({}));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.details).toHaveLength(1);
    expect(body.details[0].path).toStrictEqual(["name"]);
  });
});
