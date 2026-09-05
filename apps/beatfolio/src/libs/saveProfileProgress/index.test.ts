import { describe, it, expect } from "vitest";
import { chapterStep, saveStepProgressSchema, toSaveProgress } from "./index";

describe("saveStepProgressSchema", () => {
  it("attributes / chapter:<code> / links を受け付ける", () => {
    expect(
      saveStepProgressSchema.safeParse({
        saved: ["attributes", "chapter:beginning"],
        failedAt: "links",
      }).success,
    ).toBe(true);
  });

  it.each([
    ["未知のステップ", { saved: [], failedAt: "image" }],
    ["問いのコードが無い章", { saved: ["chapter:"], failedAt: "links" }],
    ["saved が配列でない", { saved: "attributes", failedAt: "links" }],
  ])("%s は弾く", (_, input) => {
    expect(saveStepProgressSchema.safeParse(input).success).toBe(false);
  });
});

describe("chapterStep", () => {
  it("問いのコードから章ステップの識別子を作る", () => {
    expect(chapterStep("beginning")).toBe("chapter:beginning");
  });
});

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
