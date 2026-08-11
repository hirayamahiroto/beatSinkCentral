import { describe, it, expect } from "vitest";
import { forwardUpstreamError } from "./index";

const upstream = (status: number, body: string) => ({
  status,
  text: () => Promise.resolve(body),
});

describe("forwardUpstreamError", () => {
  it("上流の status をそのまま保つ", async () => {
    const res = await forwardUpstreamError(upstream(409, "{}"));

    expect(res.status).toBe(409);
  });

  it("上流のボディをそのまま返す", async () => {
    const res = await forwardUpstreamError(
      upstream(422, '{"error":"Invalid name format"}'),
    );

    expect(await res.json()).toStrictEqual({ error: "Invalid name format" });
  });

  it("content-type を application/json にする", async () => {
    const res = await forwardUpstreamError(upstream(404, "{}"));

    expect(res.headers.get("content-type")).toBe("application/json");
  });

  it("5xx もそのまま透過する", async () => {
    const res = await forwardUpstreamError(
      upstream(500, '{"error":"Internal Server Error"}'),
    );

    expect(res.status).toBe(500);
    expect(await res.json()).toStrictEqual({
      error: "Internal Server Error",
    });
  });
});
