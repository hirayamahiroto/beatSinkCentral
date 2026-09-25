import { describe, it, expect, vi } from "vitest";
import { listStoryQuestions } from "./index";
import type { IStoryQuestionReader } from "../../../domain/storyQuestions/repositories";
import type { PublicReadCapabilities } from "../../../capabilities";

describe("listStoryQuestions", () => {
  it("問いマスタに必須フラグ（始まりの章のみ必須）を付けて ok で返す", async () => {
    const findAll = vi.fn<IStoryQuestionReader["findAll"]>(async () => [
      { code: "beginning", label: "始まり" },
      { code: "turning_point", label: "転機" },
      { code: "concept", label: "何を表現したいのか" },
    ]);
    const caps = { storyQuestions: { findAll } } satisfies Pick<
      PublicReadCapabilities,
      "storyQuestions"
    >;

    const result = await listStoryQuestions(caps);

    expect(findAll).toHaveBeenCalledTimes(1);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toStrictEqual({
        storyQuestions: [
          { code: "beginning", label: "始まり", required: true },
          { code: "turning_point", label: "転機", required: false },
          { code: "concept", label: "何を表現したいのか", required: false },
        ],
      });
    }
  });
});
