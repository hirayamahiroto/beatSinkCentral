import { describe, it, expect } from "vitest";
import type { Artist } from "./index";
import { createAccountId } from "../valueObjects/accountId";
import { createArtistId } from "../valueObjects/artistId";

describe("Artist", () => {
  it("VO を組み合わせて Artist を構成できる", () => {
    const accountId = createAccountId("beatboxer_01");
    const artistId = createArtistId("11111111-1111-1111-1111-111111111111");
    if (!accountId.ok || !artistId.ok) throw new Error("fixture invalid");

    const artist: Artist = {
      artistId: artistId.value,
      accountId: accountId.value,
      ownerUserId: "user-1",
      profile: null,
    };

    expect(artist.accountId.value).toBe("beatboxer_01");
    expect(artist.profile).toBeNull();
  });

  it("accountId と artistId はブランドが異なり入れ替えられない", () => {
    const accountId = createAccountId("beatboxer_01");
    if (!accountId.ok) throw new Error("fixture invalid");

    const artist: Artist = {
      // @ts-expect-error AccountId を artistId に代入できない（_tag が異なる）
      artistId: accountId.value,
      accountId: accountId.value,
      ownerUserId: "user-1",
      profile: null,
    };
    void artist;
  });
});
