import { describe, it, expect } from "vitest";
import { reconstructArtist } from "./index";

describe("reconstructArtist", () => {
  const baseParams = {
    artistId: "artist-1",
    accountId: "user_123",
    ownerUserId: "user-1",
    profile: null,
  };

  it("有効なパラメータでArtistを再構築できる", () => {
    const artist = reconstructArtist(baseParams);

    expect(artist.getArtistId()).toBe("artist-1");
    expect(artist.getAccountId()).toBe("user_123");
    expect(artist.getProfile()).toBeNull();
    expect(artist.hasProfile()).toBe(false);
  });

  it("profileがある場合はhasProfileがtrueになる", () => {
    const artist = reconstructArtist({
      ...baseParams,
      profile: { name: "Test Artist" },
    });

    expect(artist.getProfile()).toStrictEqual({ name: "Test Artist" });
    expect(artist.hasProfile()).toBe(true);
  });
});
