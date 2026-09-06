import { describe, it, expect } from "vitest";
import { createArtistNotFoundError } from "./index";

describe("ArtistNotFoundError", () => {
  it("type に ArtistNotFoundError を持つ Error を生成する", () => {
    const error = createArtistNotFoundError();

    expect(error).toBeInstanceOf(Error);
    expect(error.type).toBe("ArtistNotFoundError");
  });
});
