import { describe, it, expect, vi } from "vitest";
import { listLinkTypes } from "./index";

describe("listLinkTypes", () => {
  it("リーダーの結果を linkTypes として ok で返す", async () => {
    const findAll = vi.fn().mockResolvedValue([
      { type: "youtube", label: "YouTube" },
      { type: "x", label: "X" },
    ]);

    const result = await listLinkTypes({ linkTypes: { findAll } });

    expect(findAll).toHaveBeenCalledTimes(1);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({
        linkTypes: [
          { type: "youtube", label: "YouTube" },
          { type: "x", label: "X" },
        ],
      });
    }
  });
});
