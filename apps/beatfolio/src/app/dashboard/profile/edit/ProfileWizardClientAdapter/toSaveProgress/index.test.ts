import { describe, it, expect } from "vitest";
import { toSaveProgress } from "./index";

describe("toSaveProgress", () => {
  it("章ステップは chapters 区画にまとめる", () => {
    expect(
      toSaveProgress({
        saved: ["attributes", "chapter:beginning", "chapter:turning_point"],
        failedAt: "links",
      }),
    ).toStrictEqual({
      savedSections: ["attributes", "chapters"],
      failedSection: "links",
    });
  });

  it("途中の章で失敗したら chapters は保存済みに含めない", () => {
    expect(
      toSaveProgress({
        saved: ["attributes", "chapter:beginning"],
        failedAt: "chapter:turning_point",
      }),
    ).toStrictEqual({
      savedSections: ["attributes"],
      failedSection: "chapters",
    });
  });

  it("最初のステップで失敗したら保存済みは空", () => {
    expect(toSaveProgress({ saved: [], failedAt: "attributes" })).toStrictEqual(
      { savedSections: [], failedSection: "attributes" },
    );
  });
});
