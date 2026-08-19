import { describe, it, expect } from "vitest";
import { createArtistProfileNotFoundError } from "./index";

describe("ArtistProfileNotFoundError", () => {
  it("type に ArtistProfileNotFoundError を持つ Error を生成する", () => {
    const error = createArtistProfileNotFoundError();

    expect(error).toBeInstanceOf(Error);
    expect(error.type).toBe("ArtistProfileNotFoundError");
  });
});
