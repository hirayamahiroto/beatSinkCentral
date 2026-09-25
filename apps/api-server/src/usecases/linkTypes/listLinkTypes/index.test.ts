import { describe, it, expect, vi } from "vitest";
import { listLinkTypes } from "./index";
import type { ILinkTypeReader } from "../../../domain/linkTypes/repositories";
import type { PublicReadCapabilities } from "../../../capabilities";

describe("listLinkTypes", () => {
  it("リーダーの結果を linkTypes として ok で返す", async () => {
    const findAll = vi.fn<ILinkTypeReader["findAll"]>(async () => [
      { type: "youtube", label: "YouTube" },
      { type: "x", label: "X" },
    ]);
    const caps = { linkTypes: { findAll } } satisfies Pick<
      PublicReadCapabilities,
      "linkTypes"
    >;

    const result = await listLinkTypes(caps);

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
