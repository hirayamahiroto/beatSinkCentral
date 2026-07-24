import { describe, it, expect } from "vitest";
import { createAccountId, type AccountId } from "./index";
import { createArtistId } from "../artistId";

describe("createAccountId", () => {
  it("英数字とアンダースコアなら ok(AccountId) を返す", () => {
    const result = createAccountId(" beatboxer_01 ");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.value).toBe("beatboxer_01");
      expect(result.value._tag).toBe("AccountId");
    }
  });

  it("記号を含むと throw せず err を返す", () => {
    const result = createAccountId("bad id!");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidAccountIdFormatError");
    }
  });

  it("ArtistId は AccountId に代入できない（コンパイル時にブランドで弾く）", () => {
    const artistId = createArtistId("11111111-1111-1111-1111-111111111111");
    if (artistId.ok) {
      // @ts-expect-error ArtistId と AccountId は _tag が異なるため代入不可
      const _accountId: AccountId = artistId.value;
      void _accountId;
    }
  });
});
