import { describe, it, expect } from "vitest";
import { reconstructArtist } from "../factories";
import { createAccountId, type AccountId } from "../valueObjects/accountId";
import { unwrapOrThrow } from "../../../utils/result";

const accountIdOf = (value: string): AccountId =>
  unwrapOrThrow(createAccountId(value), "test setup: invalid accountId");

const baseParams = {
  artistId: "artist-1",
  accountId: "user_123",
  ownerUserId: "user-1",
  profile: null,
};

const artist = reconstructArtist(baseParams);

describe("createArtistBehaviors", () => {
  it("getArtistIdで値を返す", () => {
    expect(artist.getArtistId()).toBe("artist-1");
  });

  it("getAccountIdで値を返す", () => {
    expect(artist.getAccountId()).toBe("user_123");
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

  describe("hasAccountId", () => {
    it("同じ値の AccountId なら true", () => {
      expect(artist.hasAccountId(accountIdOf("user_123"))).toBe(true);
    });

    it("異なる値の AccountId なら false", () => {
      expect(artist.hasAccountId(accountIdOf("other_handle"))).toBe(false);
    });
  });

  describe("changeAccountId", () => {
    it("新しいaccountId VOを持つArtistを返す", () => {
      const updated = artist.changeAccountId(accountIdOf("new_handle"));

      expect(updated.getAccountId()).toBe("new_handle");
      expect(updated.getArtistId()).toBe(baseParams.artistId);
      expect(updated.getOwnerUserId()).toBe(baseParams.ownerUserId);
    });

    it("元のArtistは不変", () => {
      artist.changeAccountId(accountIdOf("new_handle"));

      expect(artist.getAccountId()).toBe("user_123");
    });
  });
});
