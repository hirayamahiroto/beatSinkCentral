import { describe, it, expect } from "vitest";
import {
  createArtistProfileNotFoundError,
  isArtistProfileNotFoundError,
} from "./index";

describe("ArtistProfileNotFoundError", () => {
  it("type に ArtistProfileNotFoundError を持つ Error を生成する", () => {
    const error = createArtistProfileNotFoundError();

    expect(error).toBeInstanceOf(Error);
    expect(error.type).toBe("ArtistProfileNotFoundError");
  });

  it("生成したエラーを型ガードで判別できる", () => {
    expect(
      isArtistProfileNotFoundError(createArtistProfileNotFoundError()),
    ).toBe(true);
  });

  it("別のエラーや非 Error は判別しない", () => {
    expect(isArtistProfileNotFoundError(new Error("boom"))).toBe(false);
    expect(
      isArtistProfileNotFoundError({ type: "ArtistProfileNotFoundError" }),
    ).toBe(false);
    expect(isArtistProfileNotFoundError(null)).toBe(false);
  });
});
