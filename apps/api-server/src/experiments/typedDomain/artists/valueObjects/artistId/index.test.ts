import { describe, it, expect } from "vitest";
import { createArtistId } from "./index";

describe("createArtistId", () => {
  it("空でなければ ok(ArtistId) を返す", () => {
    const result = createArtistId("11111111-1111-1111-1111-111111111111");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.value).toBe("11111111-1111-1111-1111-111111111111");
      expect(result.value._tag).toBe("ArtistId");
    }
  });

  it("空白のみなら throw せず err を返す", () => {
    const result = createArtistId("   ");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidArtistIdFormatError");
    }
  });
});
