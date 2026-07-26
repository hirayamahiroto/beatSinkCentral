import { describe, it, expect } from "vitest";
import { assertAccountIdAvailable } from "./index";
import { createAccountId } from "../valueObjects/accountId";
import { createArtistId } from "../valueObjects/artistId";
import type { Artist } from "../artist";

const buildArtist = (): Artist => {
  const accountId = createAccountId("existing_account");
  const artistId = createArtistId("existing-artist-id");
  if (!accountId.ok || !artistId.ok) throw new Error("fixture invalid");
  return {
    artistId: artistId.value,
    accountId: accountId.value,
    ownerUserId: "owner-id",
    profile: null,
  };
};

describe("assertAccountIdAvailable", () => {
  it("空き(null)なら ok", () => {
    expect(assertAccountIdAvailable(null).ok).toBe(true);
  });

  it("使用済みなら AccountIdAlreadyTakenError を返す", () => {
    const result = assertAccountIdAvailable(buildArtist());
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("AccountIdAlreadyTakenError");
    }
  });
});
