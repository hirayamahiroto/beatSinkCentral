import { describe, it, expect } from "vitest";
import { resolveLinkLabels } from "./index";

const linkTypes = [
  { type: "youtube", label: "YouTube" },
  { type: "other", label: "その他" },
];

describe("resolveLinkLabels", () => {
  it("マスタの label を種別コードから解決する", () => {
    const result = resolveLinkLabels(
      [{ type: "youtube", url: "https://youtube.com/@saku", label: null }],
      linkTypes,
    );

    expect(result).toEqual([
      { url: "https://youtube.com/@saku", label: "YouTube" },
    ]);
  });

  it("リンク個別の label があればマスタより優先する", () => {
    const result = resolveLinkLabels(
      [{ type: "other", url: "https://example.com/me", label: "個人HP" }],
      linkTypes,
    );

    expect(result).toEqual([
      { url: "https://example.com/me", label: "個人HP" },
    ]);
  });

  it("マスタに存在しない種別は解決できないため例外にする", () => {
    expect(() =>
      resolveLinkLabels(
        [{ type: "unknown", url: "https://example.com", label: null }],
        linkTypes,
      ),
    ).toThrow("Unknown link type: unknown");
  });
});
