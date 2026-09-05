import { describe, it, expect, vi } from "vitest";
import { listPresentationPatterns } from "./index";

describe("listPresentationPatterns", () => {
  it("マスタの一覧をそのまま返す", async () => {
    const rows = [
      { code: "interview", label: "インタビュー" },
      { code: "zoom_dive", label: "ズーム" },
    ];
    const caps = {
      presentationPatterns: { findAll: vi.fn(async () => rows) },
    };

    const result = await listPresentationPatterns(caps);

    expect(result).toStrictEqual({
      ok: true,
      value: { presentationPatterns: rows },
    });
    expect(caps.presentationPatterns.findAll).toHaveBeenCalledTimes(1);
  });
});
