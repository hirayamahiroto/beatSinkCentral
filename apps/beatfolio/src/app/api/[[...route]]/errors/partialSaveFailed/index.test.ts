import { describe, it, expect } from "vitest";
import { createPartialSaveFailedError } from "./index";
import { createUpstreamServerError } from "../upstreamServerError";

describe("createPartialSaveFailedError", () => {
  it("保存済みステップ・失敗ステップ・上流エラーを保持する Error を作る", () => {
    const upstream = createUpstreamServerError(503);
    const error = createPartialSaveFailedError({
      saved: ["attributes", "chapter:beginning"],
      failedAt: "links",
      upstream,
    });

    expect(error).toBeInstanceOf(Error);
    expect(error.type).toBe("PartialSaveFailedError");
    expect(error.saved).toStrictEqual(["attributes", "chapter:beginning"]);
    expect(error.failedAt).toBe("links");
    expect(error.upstream).toBe(upstream);
  });
});
