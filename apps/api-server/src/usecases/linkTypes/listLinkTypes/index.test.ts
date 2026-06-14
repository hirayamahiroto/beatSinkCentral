import { describe, it, expect, vi } from "vitest";
import { listLinkTypesUseCase } from "./index";

describe("listLinkTypesUseCase", () => {
  it("リポジトリの結果を linkTypes として返す", async () => {
    const findAll = vi.fn().mockResolvedValue([
      { type: "youtube", label: "YouTube" },
      { type: "x", label: "X" },
    ]);

    const result = await listLinkTypesUseCase({
      linkTypeRepository: { findAll },
    });

    expect(findAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      linkTypes: [
        { type: "youtube", label: "YouTube" },
        { type: "x", label: "X" },
      ],
    });
  });
});
