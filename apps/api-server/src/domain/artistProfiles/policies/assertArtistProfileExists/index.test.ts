import { describe, it, expect } from "vitest";
import {
  assertArtistProfileExists,
  isArtistProfileNotFoundError,
} from "./index";
import { reconstructArtistProfile } from "../../factories";

describe("assertArtistProfileExists", () => {
  it("profile が存在すれば何もスローしない", () => {
    const profile = reconstructArtistProfile({
      id: "profile-1",
      artistId: "artist-1",
      published: false,
    });
    expect(() => assertArtistProfileExists(profile)).not.toThrow();
  });

  it("null の場合は ArtistProfileNotFoundError をスローする", () => {
    expect(() => assertArtistProfileExists(null)).toThrow();
    try {
      assertArtistProfileExists(null);
    } catch (error) {
      expect(isArtistProfileNotFoundError(error)).toBe(true);
    }
  });
});
