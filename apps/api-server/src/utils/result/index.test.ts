import { describe, it, expect } from "vitest";
import { ok, err, map, traverse, all, unwrapOrThrow } from "./index";

const positive = (n: number) =>
  n >= 0 ? ok(n) : err({ type: "Negative" as const, input: n });

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
});

describe("map", () => {
  it("成功時だけ変換する", () => {
    expect(map(ok(2), (n) => n * 2)).toEqual({ ok: true, value: 4 });
    expect(map(err<string>("e"), (n: number) => n * 2)).toEqual({
      ok: false,
      error: "e",
    });
  });
});

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
    expect(
      all({ count: positive(1), label: ok("a"), absent: ok(null) }),
    ).toEqual({ ok: true, value: { count: 1, label: "a", absent: null } });
  });

  it("フィールドごとの値の型が個別に保たれる", () => {
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
    expect(all({ first: positive(-1), second: positive(-2) })).toEqual({
      ok: false,
      error: { type: "Negative", input: -1 },
    });
  });

  it("空オブジェクトは空オブジェクトの ok を返す", () => {
    expect(all({})).toEqual({ ok: true, value: {} });
  });
});

describe("unwrapOrThrow", () => {
  it("成功なら値を返す", () => {
    expect(unwrapOrThrow(ok(1), "unreachable")).toBe(1);
  });

  it("失敗ならメッセージ付きでスローする", () => {
    expect(() => unwrapOrThrow(positive(-1), "broken data")).toThrowError(
      "broken data",
    );
  });

  it("失敗なら元のエラーを cause に保持する", () => {
    try {
      unwrapOrThrow(positive(-1), "broken data");
      expect.unreachable();
    } catch (error) {
      expect(error).toMatchObject({ cause: { type: "Negative", input: -1 } });
    }
  });
});
