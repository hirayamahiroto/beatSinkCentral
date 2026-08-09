import { describe, it, expect } from "vitest";
import { getRequestContext, runWithRequestContext } from "./index";

describe("runWithRequestContext", () => {
  it("実行中のコンテキストを取得できる", () => {
    const seen = runWithRequestContext({ requestId: "req-1" }, () =>
      getRequestContext(),
    );

    expect(seen).toStrictEqual({ requestId: "req-1" });
  });

  it("await をまたいでもコンテキストを保持する", async () => {
    const seen = await runWithRequestContext(
      { requestId: "req-1", traceId: "a".repeat(32) },
      async () => {
        await Promise.resolve();
        return getRequestContext();
      },
    );

    expect(seen).toStrictEqual({
      requestId: "req-1",
      traceId: "a".repeat(32),
    });
  });

  it("ネストしたコンテキストは内側が優先され、抜けると元に戻る", () => {
    const seen = runWithRequestContext({ requestId: "outer" }, () => {
      const inner = runWithRequestContext({ requestId: "inner" }, () =>
        getRequestContext(),
      );
      return { inner, afterInner: getRequestContext() };
    });

    expect(seen.inner).toStrictEqual({ requestId: "inner" });
    expect(seen.afterInner).toStrictEqual({ requestId: "outer" });
  });

  it("並行して走るコンテキストは互いに混ざらない", async () => {
    const [first, second] = await Promise.all([
      runWithRequestContext({ requestId: "req-1" }, async () => {
        await Promise.resolve();
        return getRequestContext();
      }),
      runWithRequestContext({ requestId: "req-2" }, async () => {
        await Promise.resolve();
        return getRequestContext();
      }),
    ]);

    expect(first).toStrictEqual({ requestId: "req-1" });
    expect(second).toStrictEqual({ requestId: "req-2" });
  });
});

describe("getRequestContext", () => {
  it("コンテキスト外では undefined を返す", () => {
    expect(getRequestContext()).toBeUndefined();
  });
});
