import { describe, it, expect } from "vitest";
import { resolveStoryQuestionLabels } from "./index";

const storyQuestions = [
  { code: "beginning", label: "始まり" },
  { code: "turning_point", label: "転機" },
];

describe("resolveStoryQuestionLabels", () => {
  it("章の key を問いマスタのラベルへ解決する", () => {
    expect(
      resolveStoryQuestionLabels(
        [
          { key: "beginning", body: "私の歩み" },
          { key: "turning_point", body: "転機の話" },
        ],
        storyQuestions,
      ),
    ).toStrictEqual([
      { key: "beginning", label: "始まり", body: "私の歩み" },
      { key: "turning_point", label: "転機", body: "転機の話" },
    ]);
  });

  it("マスタに無い key は契約違反として throw する", () => {
    expect(() =>
      resolveStoryQuestionLabels(
        [{ key: "unknown", body: "x" }],
        storyQuestions,
      ),
    ).toThrow("Unknown story question: unknown");
  });
});
