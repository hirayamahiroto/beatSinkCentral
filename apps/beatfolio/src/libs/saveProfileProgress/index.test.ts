import { describe, it, expect } from "vitest";
import { chapterStep, saveStepProgressSchema } from "./index";

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
