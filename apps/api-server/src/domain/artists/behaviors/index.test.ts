import { describe, it, expect } from "vitest";
import { createArtistBehaviors } from "./index";
import { createArtistId } from "../valueObjects/artistId";
import { createAccountId } from "../valueObjects/accountId";

const baseState = {
  artistId: createArtistId("artist-1"),
  accountId: createAccountId("user_123"),
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

  describe("changeAccountId", () => {
    it("新しいaccountId VOを持つArtistを返す", () => {
      const artist = createArtistBehaviors(baseState);
      const updated = artist.changeAccountId(createAccountId("new_handle"));

      expect(updated.getAccountId()).toBe("new_handle");
      expect(updated.getArtistId()).toBe(baseState.artistId.value);
      expect(updated.getOwnerUserId()).toBe(baseState.ownerUserId);
    });

    it("元のArtistは不変", () => {
      const artist = createArtistBehaviors(baseState);
      artist.changeAccountId(createAccountId("new_handle"));

      expect(artist.getAccountId()).toBe("user_123");
    });
  });
});
