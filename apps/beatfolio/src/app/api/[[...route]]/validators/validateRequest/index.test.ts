import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { z } from "zod";
import { validateRequest } from "./index";
import { handleBffError } from "../../../../../errorMap";

const createApp = () =>
  new Hono()
    .post(
      "/",
      validateRequest("json", z.object({ name: z.string().min(1) })),
      (c) => c.json(c.req.valid("json")),
    )
    .onError(handleBffError);

const post = (body: unknown) =>
  createApp().request("/", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

describe("validateRequest", () => {
  it("検証を通った値をハンドラへ渡す", async () => {
    const res = await post({ name: "saku" });

    expect(res.status).toBe(200);
    expect(await res.json()).toStrictEqual({ name: "saku" });
  });

  it("検証に失敗したら InvalidRequestFormatError として 400 と issues を返す", async () => {
    const res = await post({ name: "" });

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      error: "Invalid request",
      code: "InvalidRequestFormatError",
      issues: [expect.objectContaining({ path: ["name"] })],
    });
  });
});
