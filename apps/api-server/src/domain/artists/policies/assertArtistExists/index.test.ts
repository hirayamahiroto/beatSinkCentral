import { describe, it, expect } from "vitest";
import { assertArtistExists, isArtistNotFoundError } from "./index";
import { reconstructArtist } from "../../factories";

describe("assertArtistExists", () => {
  it("artistが存在すれば何もスローしない", () => {
    const artist = reconstructArtist({
      artistId: "artist-1",
      accountId: "user_123",
      ownerUserId: "user-1",
      profile: null,
    });

    expect(() => assertArtistExists(artist)).not.toThrow();
  });

  it("artistがnullの場合はArtistNotFoundErrorをスローする", () => {
    expect(() => assertArtistExists(null)).toThrowError();

    try {
      assertArtistExists(null);
    } catch (error) {
      expect(isArtistNotFoundError(error)).toBe(true);
    }
  });
});
