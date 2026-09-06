import { describe, it, expect } from "vitest";
import { createCoPerformer } from "./index";

describe("createCoPerformer", () => {
  it("未登録の共演者は表示名だけを保持し artist は null", () => {
    const result = createCoPerformer({ name: "  Hana  ", artist: null });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toStrictEqual({ name: "Hana", artist: null });
    }
  });

  it("登録済みの共演者は artistId と handle を入れ替えずに保持する", () => {
    const result = createCoPerformer({
      name: "Hana",
      artist: { artistId: "artist-2", handle: "hana_bb" },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toStrictEqual({
        name: "Hana",
        artist: { artistId: "artist-2", handle: "hana_bb" },
      });
    }
  });

  it("表示名が空なら err(InvalidCoPerformerFormatError)", () => {
    const result = createCoPerformer({ name: "  ", artist: null });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidCoPerformerFormatError");
    }
  });

  it("表示名が255文字超なら err(InvalidCoPerformerFormatError)", () => {
    const result = createCoPerformer({ name: "a".repeat(256), artist: null });

    expect(result.ok).toBe(false);
  });
});
