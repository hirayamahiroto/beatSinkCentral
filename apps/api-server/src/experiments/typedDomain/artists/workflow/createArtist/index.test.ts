import { describe, it, expect } from "vitest";
import { createArtist } from "./index";
import type { Artist } from "../../artist";
import { createAccountId } from "../../valueObjects/accountId";
import { createArtistId } from "../../valueObjects/artistId";

const NEW_ID = "22222222-2222-2222-2222-222222222222";

const buildExistingArtist = (): Artist => {
  const accountId = createAccountId("existing_account");
  const artistId = createArtistId("00000000-0000-0000-0000-000000000000");
  if (!accountId.ok || !artistId.ok) throw new Error("fixture invalid");
  return {
    artistId: artistId.value,
    accountId: accountId.value,
    ownerUserId: "owner-existing",
    profile: null,
  };
};

describe("createArtist workflow", () => {
  it("accountId が空きで入力が正当なら Artist を返す", () => {
    const result = createArtist(
      { accountId: "beatboxer_01", ownerUserId: "owner-1" },
      null,
      NEW_ID,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.accountId.value).toBe("beatboxer_01");
      expect(result.value.artistId.value).toBe(NEW_ID);
      expect(result.value.ownerUserId).toBe("owner-1");
      expect(result.value.profile).toBeNull();
    }
  });

  it("accountId が使用済みなら AccountIdAlreadyTakenError で短絡する", () => {
    const result = createArtist(
      { accountId: "beatboxer_01", ownerUserId: "owner-1" },
      buildExistingArtist(),
      NEW_ID,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("AccountIdAlreadyTakenError");
    }
  });

  it("accountId が不正なら InvalidAccountIdFormatError を型付きで返す", () => {
    const result = createArtist(
      { accountId: "bad id!", ownerUserId: "owner-1" },
      null,
      NEW_ID,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidAccountIdFormatError");
    }
  });
});
