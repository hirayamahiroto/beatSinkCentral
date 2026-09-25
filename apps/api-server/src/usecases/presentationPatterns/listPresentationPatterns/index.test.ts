import { describe, it, expect, vi } from "vitest";
import { listPresentationPatterns } from "./index";
import type { IPresentationPatternReader } from "../../../domain/presentationPatterns/repositories";
import type { PublicReadCapabilities } from "../../../capabilities";

describe("listPresentationPatterns", () => {
  it("マスタの一覧をそのまま返す", async () => {
    const rows = [
      { code: "interview", label: "インタビュー" },
      { code: "zoom_dive", label: "ズーム" },
    ];
    const findAll = vi.fn<IPresentationPatternReader["findAll"]>(
      async () => rows,
    );
    const caps = { presentationPatterns: { findAll } } satisfies Pick<
      PublicReadCapabilities,
      "presentationPatterns"
    >;

    const result = await listPresentationPatterns(caps);

    expect(result).toStrictEqual({
      ok: true,
      value: { presentationPatterns: rows },
    });
    expect(findAll).toHaveBeenCalledTimes(1);
  });
});
