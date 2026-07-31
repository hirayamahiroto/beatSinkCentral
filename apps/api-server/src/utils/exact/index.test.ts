import { describe, it, expect } from "vitest";
import type { Exact } from "./index";

type Shape = { a: string; b: number };

const accept = <Actual extends Shape>(value: Exact<Shape, Actual>): Shape =>
  value;

describe("Exact", () => {
  it("ちょうどのキーを持つ値は受け付ける", () => {
    expect(accept({ a: "x", b: 1 })).toEqual({ a: "x", b: 1 });
  });

  it("余剰キーを持つ値はコンパイルエラーになる", () => {
    const surplus = { a: "x", b: 1, c: true };

    // @ts-expect-error c は Shape に無いため never 制約で弾かれる
    accept(surplus);
    expect(surplus.c).toBe(true);
  });

  it("スプレッドで渡しても余剰キーを弾く", () => {
    const container = { a: "x", b: 1, c: true };

    // @ts-expect-error スプレッドでも余剰キーは素通りしない
    accept({ ...container });
    expect(container.c).toBe(true);
  });

  it("キーが不足していればコンパイルエラーになる", () => {
    // @ts-expect-error b が無い
    accept({ a: "x" });
    expect(true).toBe(true);
  });
});
