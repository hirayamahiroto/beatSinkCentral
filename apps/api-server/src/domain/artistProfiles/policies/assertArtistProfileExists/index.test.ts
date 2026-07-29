import { describe, it, expect } from "vitest";
import {
  createArtistProfileNotFoundError,
  isArtistProfileNotFoundError,
} from "./index";

describe("ArtistProfileNotFoundError", () => {
  it("type を持つ Error として生成される", () => {
    const error = createArtistProfileNotFoundError();

    expect(error).toBeInstanceOf(Error);
    expect(error.type).toBe("ArtistProfileNotFoundError");
  });

  it("isArtistProfileNotFoundError は自身のエラーだけを判別する", () => {
    expect(
      isArtistProfileNotFoundError(createArtistProfileNotFoundError()),
    ).toBe(true);
    expect(isArtistProfileNotFoundError(new Error("other"))).toBe(false);
    expect(isArtistProfileNotFoundError(null)).toBe(false);
  });
});
