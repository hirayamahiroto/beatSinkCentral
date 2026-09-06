import { describe, it, expect } from "vitest";
import { reconstructArtist } from "../factories";
import { createHandle, type Handle } from "../valueObjects/handle";
import { unwrapOrThrow } from "../../../utils/result";

const handleOf = (value: string): Handle =>
  unwrapOrThrow(createHandle(value), "test setup: invalid handle");

const baseParams = {
  artistId: "artist-1",
  handle: "user_123",
  ownerUserId: "user-1",
  profile: null,
};

const artist = reconstructArtist(baseParams);

describe("createArtistBehaviors", () => {
  it("getArtistIdで値を返す", () => {
    expect(artist.getArtistId()).toBe("artist-1");
  });

  it("getHandleで値を返す", () => {
    expect(artist.getHandle()).toBe("user_123");
  });

  it("profileがnullの場合はgetProfile/hasProfileがnull/falseを返す", () => {
    expect(artist.getProfile()).toBeNull();
    expect(artist.hasProfile()).toBe(false);
  });

  it("profileがある場合はgetProfile/hasProfileが値/trueを返す", () => {
    const withProfile = reconstructArtist({
      ...baseParams,
      profile: { name: "Test Artist" },
    });

    expect(withProfile.getProfile()).toStrictEqual({ name: "Test Artist" });
    expect(withProfile.hasProfile()).toBe(true);
  });

  describe("hasHandle", () => {
    it("同じ値の Handle なら true", () => {
      expect(artist.hasHandle(handleOf("user_123"))).toBe(true);
    });

    it("異なる値の Handle なら false", () => {
      expect(artist.hasHandle(handleOf("other_handle"))).toBe(false);
    });
  });

  describe("changeHandle", () => {
    it("新しいhandle VOを持つArtistを返す", () => {
      const updated = artist.changeHandle(handleOf("new_handle"));

      expect(updated.getHandle()).toBe("new_handle");
      expect(updated.getArtistId()).toBe(baseParams.artistId);
      expect(updated.getOwnerUserId()).toBe(baseParams.ownerUserId);
    });

    it("元のArtistは不変", () => {
      artist.changeHandle(handleOf("new_handle"));

      expect(artist.getHandle()).toBe("user_123");
    });
  });
});
