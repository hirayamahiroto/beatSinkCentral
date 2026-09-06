import { describe, it, expect } from "vitest";
import { createArtistNotFoundError, isArtistNotFoundError } from "./index";

describe("ArtistNotFoundError", () => {
  it("type に ArtistNotFoundError を持つ Error を生成する", () => {
    const error = createArtistNotFoundError();

    expect(error).toBeInstanceOf(Error);
    expect(error.type).toBe("ArtistNotFoundError");
  });

  it("生成したエラーを型ガードで判別できる", () => {
    expect(isArtistNotFoundError(createArtistNotFoundError())).toBe(true);
  });

  it("別のエラーや非 Error は判別しない", () => {
    expect(isArtistNotFoundError(new Error("boom"))).toBe(false);
    expect(isArtistNotFoundError({ type: "ArtistNotFoundError" })).toBe(false);
    expect(isArtistNotFoundError(null)).toBe(false);
  });
});
