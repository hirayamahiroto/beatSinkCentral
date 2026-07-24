import { describe, it, expect } from "vitest";
import { ok, err, map, flatMap } from "./index";

describe("Result", () => {
  it("ok は成功値を保持する", () => {
    const result = ok(1);
    expect(result).toEqual({ ok: true, value: 1 });
  });

  it("err はエラー値を保持する", () => {
    const result = err({ type: "SomeError" });
    expect(result).toEqual({ ok: false, error: { type: "SomeError" } });
  });

  it("map は成功時だけ値を変換する", () => {
    expect(map(ok(2), (n) => n * 2)).toEqual({ ok: true, value: 4 });
    expect(map(err<string>("e"), (n: number) => n * 2)).toEqual({
      ok: false,
      error: "e",
    });
  });

  it("flatMap は成功を連結し、失敗で短絡する", () => {
    const ge = (n: number) =>
      n >= 0 ? ok(n) : err({ type: "Negative" as const });

    expect(flatMap(ok(3), ge)).toEqual({ ok: true, value: 3 });
    expect(flatMap(ok(-1), ge)).toEqual({
      ok: false,
      error: { type: "Negative" },
    });
    expect(flatMap(err({ type: "Upstream" as const }), ge)).toEqual({
      ok: false,
      error: { type: "Upstream" },
    });
  });
});
