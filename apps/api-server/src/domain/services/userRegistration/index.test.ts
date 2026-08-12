import { describe, it, expect } from "vitest";
import { registerNewUser, type RegisterNewUserInput } from "./index";
import { reconstructUser } from "../../users/factories";
import { reconstructArtist } from "../../artists/factories";

const validInput = {
  subId: "auth0|123456789",
  email: "test@example.com",
  accountId: "test_account",
} satisfies RegisterNewUserInput;

const existingUser = reconstructUser({
  id: "user-1",
  subId: validInput.subId,
  email: validInput.email,
});

const existingArtist = reconstructArtist({
  artistId: "artist-1",
  accountId: validInput.accountId,
  ownerUserId: "other-user",
  profile: null,
});

describe("registerNewUser", () => {
  it("未登録かつaccountId未使用ならUserとArtistを生成する", () => {
    const result = registerNewUser(validInput, null, null);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.user.getSub()).toBe(validInput.subId);
      expect(result.value.user.getEmail()).toBe(validInput.email);
      expect(result.value.artist.getAccountId()).toBe(validInput.accountId);
    }
  });

  it("生成したArtistの所有者は生成したUserになる", () => {
    const result = registerNewUser(validInput, null, null);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.artist.getOwnerUserId()).toBe(
        result.value.user.getId(),
      );
    }
  });

  it("既に登録済みなら UserAlreadyRegisteredError を err で返す", () => {
    const result = registerNewUser(validInput, existingUser, null);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("UserAlreadyRegisteredError");
    }
  });

  it("accountIdが使用済みなら AccountIdAlreadyTakenError を err で返す", () => {
    const result = registerNewUser(validInput, null, existingArtist);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("AccountIdAlreadyTakenError");
    }
  });

  it("AccountIdAlreadyTakenError には衝突したaccountIdが入る", () => {
    const result = registerNewUser(validInput, null, existingArtist);

    expect(result.ok).toBe(false);
    if (!result.ok && result.error.type === "AccountIdAlreadyTakenError") {
      expect(result.error.accountId).toBe(validInput.accountId);
    }
  });

  it("登録済み判定はaccountId重複判定より先に評価される", () => {
    const result = registerNewUser(validInput, existingUser, existingArtist);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("UserAlreadyRegisteredError");
    }
  });

  it("emailが不正なら InvalidEmailFormatError を err で返す", () => {
    const result = registerNewUser(
      { ...validInput, email: "invalid" },
      null,
      null,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidEmailFormatError");
    }
  });

  it("accountIdが不正なら InvalidAccountIdFormatError を err で返す", () => {
    const result = registerNewUser(
      { ...validInput, accountId: "invalid handle" },
      null,
      null,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidAccountIdFormatError");
    }
  });
});
