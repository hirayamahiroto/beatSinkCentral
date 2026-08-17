import { describe, it, expect } from "vitest";
import { ok, err, type Result } from "./index";

describe("ok", () => {
  it("成功を value 付きで表す", () => {
    expect(ok("done")).toStrictEqual({ ok: true, value: "done" });
  });
});

describe("err", () => {
  it("失敗を error 付きで表す", () => {
    expect(err({ kind: "unexpected" })).toStrictEqual({
      ok: false,
      error: { kind: "unexpected" },
    });
  });
});

describe("Result", () => {
  it("ok の判別で value / error のどちらを読めるかが決まる", () => {
    const results: Result<number, string>[] = [ok(1), err("boom")];

    const readable = results.map((result) =>
      result.ok ? result.value : result.error,
    );

    expect(readable).toStrictEqual([1, "boom"]);
  });
});
