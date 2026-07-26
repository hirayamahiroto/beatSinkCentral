import { describe, it, expect } from "vitest";
import { ok, err, map, flatMap } from "./index";

describe("Result", () => {
  it("ok は成功値を保持する", () => {
    expect(ok(1)).toEqual({ ok: true, value: 1 });
  });

  it("err はエラー値を保持する", () => {
    expect(err({ type: "SomeError" })).toEqual({
      ok: false,
      error: { type: "SomeError" },
    });
  });

  it("map は成功時だけ変換する", () => {
    expect(map(ok(2), (n) => n * 2)).toEqual({ ok: true, value: 4 });
    expect(map(err<string>("e"), (n: number) => n * 2)).toEqual({
      ok: false,
      error: "e",
    });
  });

  it("flatMap は成功を連結し、失敗で短絡する", () => {
    const positive = (n: number) =>
      n >= 0 ? ok(n) : err({ type: "Negative" as const });
    expect(flatMap(ok(3), positive)).toEqual({ ok: true, value: 3 });
    expect(flatMap(ok(-1), positive)).toEqual({
      ok: false,
      error: { type: "Negative" },
    });
    expect(flatMap(err({ type: "Upstream" as const }), positive)).toEqual({
      ok: false,
      error: { type: "Upstream" },
    });
  });
});
