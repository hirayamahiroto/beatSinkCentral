import { describe, it, expect } from "vitest";
import { resolveLinkLabels } from "./index";

const linkTypes = [
  { type: "youtube", label: "YouTube" },
  { type: "other", label: "その他" },
];

describe("resolveLinkLabels", () => {
  it("マスタの label を種別コードから解決する", () => {
    const result = resolveLinkLabels(
      [
        { linkTypeCode: "youtube", url: "https://youtube.com/@saku" },
        { linkTypeCode: "other", url: "https://example.com/me" },
      ],
      linkTypes,
    );

    expect(result).toStrictEqual([
      { type: "youtube", url: "https://youtube.com/@saku", label: "YouTube" },
      { type: "other", url: "https://example.com/me", label: "その他" },
    ]);
  });

  it("マスタに存在しない種別は解決できないため例外にする", () => {
    expect(() =>
      resolveLinkLabels(
        [{ linkTypeCode: "unknown", url: "https://example.com" }],
        linkTypes,
      ),
    ).toThrow("Unknown link type: unknown");
  });
});
