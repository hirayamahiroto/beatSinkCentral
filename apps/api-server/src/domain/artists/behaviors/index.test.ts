import { describe, it, expect } from "vitest";
import { createArtistBehaviors } from "./index";
import { createArtistId } from "../valueObjects/artistId";
import { createAccountId } from "../valueObjects/accountId";
import { unwrapOrThrow } from "../../../utils/result";

const artistId = unwrapOrThrow(createArtistId("artist-1"), "fixture invalid");
const accountId = unwrapOrThrow(createAccountId("user_123"), "fixture invalid");
const otherAccountId = unwrapOrThrow(
  createAccountId("other_handle"),
  "fixture invalid",
);
const newAccountId = unwrapOrThrow(
  createAccountId("new_handle"),
  "fixture invalid",
);

const baseState = {
  artistId,
  accountId,
  ownerUserId: "user-1",
  profile: null,
};

describe("createArtistBehaviors", () => {
  it("getArtistIdで値を返す", () => {
    expect(createArtistBehaviors(baseState).getArtistId()).toBe("artist-1");
  });

  it("getAccountIdで値を返す", () => {
    expect(createArtistBehaviors(baseState).getAccountId()).toBe("user_123");
  });

  it("profileがnullの場合はgetProfile/hasProfileがnull/falseを返す", () => {
    const artist = createArtistBehaviors(baseState);
    expect(artist.getProfile()).toBeNull();
    expect(artist.hasProfile()).toBe(false);
  });

  it("profileがある場合はgetProfile/hasProfileが値/trueを返す", () => {
    const artist = createArtistBehaviors({
      ...baseState,
      profile: { name: "Test Artist" },
    });
    expect(artist.getProfile()).toStrictEqual({ name: "Test Artist" });
    expect(artist.hasProfile()).toBe(true);
  });

  describe("hasAccountId", () => {
    it("同じ値の AccountId なら true", () => {
      const artist = createArtistBehaviors(baseState);
      expect(artist.hasAccountId(accountId)).toBe(true);
    });

    it("異なる値の AccountId なら false", () => {
      const artist = createArtistBehaviors(baseState);
      expect(artist.hasAccountId(otherAccountId)).toBe(false);
    });
  });

  describe("changeAccountId", () => {
    it("新しいaccountId VOを持つArtistを返す", () => {
      const artist = createArtistBehaviors(baseState);
      const updated = artist.changeAccountId(newAccountId);

      expect(updated.getAccountId()).toBe("new_handle");
      expect(updated.getArtistId()).toBe(baseState.artistId.value);
      expect(updated.getOwnerUserId()).toBe(baseState.ownerUserId);
    });

    it("元のArtistは不変", () => {
      const artist = createArtistBehaviors(baseState);
      artist.changeAccountId(newAccountId);

      expect(artist.getAccountId()).toBe("user_123");
    });
  });
});
