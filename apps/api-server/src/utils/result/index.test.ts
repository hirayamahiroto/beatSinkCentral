import { describe, it, expect } from "vitest";
import { ok, err, map, flatMap, traverse, all } from "./index";

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

const positive = (n: number) =>
  n >= 0 ? ok(n) : err({ type: "Negative" as const, input: n });

describe("traverse", () => {
  it("全要素が成功すれば値の配列を返す", () => {
    expect(traverse([1, 2, 3], positive)).toEqual({
      ok: true,
      value: [1, 2, 3],
    });
  });

  it("空配列は空配列の ok を返す", () => {
    expect(traverse([], positive)).toEqual({ ok: true, value: [] });
  });

  it("最初に失敗した要素のエラーで短絡する", () => {
    expect(traverse([1, -2, -3], positive)).toEqual({
      ok: false,
      error: { type: "Negative", input: -2 },
    });
  });
});

describe("all", () => {
  it("全フィールドが成功すればフィールドごとの値を持つ ok を返す", () => {
    const result = all({
      count: positive(1),
      label: ok("a"),
      absent: ok(null),
    });

    expect(result).toEqual({
      ok: true,
      value: { count: 1, label: "a", absent: null },
    });
  });

  it("フィールドの値の型が個別に保たれる", () => {
    const result = all({ count: positive(1), label: ok("a") });

    expect(result.ok).toBe(true);
    if (result.ok) {
      const count: number = result.value.count;
      const label: string = result.value.label;
      expect(count).toBe(1);
      expect(label).toBe("a");
    }
  });

  it("最初に失敗したフィールドのエラーで短絡する", () => {
    const result = all({ first: positive(-1), second: positive(-2) });

    expect(result).toEqual({
      ok: false,
      error: { type: "Negative", input: -1 },
    });
  });

  it("空オブジェクトは空オブジェクトの ok を返す", () => {
    expect(all({})).toEqual({ ok: true, value: {} });
  });
});
