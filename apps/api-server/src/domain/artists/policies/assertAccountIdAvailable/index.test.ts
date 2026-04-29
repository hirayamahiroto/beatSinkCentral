import { describe, it, expect } from "vitest";
import {
  assertAccountIdAvailable,
  isAccountIdAlreadyTakenError,
} from "./index";
import { reconstructArtist } from "../../factories";

describe("assertAccountIdAvailable", () => {
  it("artistIfAccountIdTakenがnullなら何もスローしない", () => {
    expect(() => assertAccountIdAvailable(null)).not.toThrow();
  });

  it("既にAccountIdが取られている場合はAccountIdAlreadyTakenErrorをスローする", () => {
    const existing = reconstructArtist({
      artistId: "artist-1",
      accountId: "taken_id",
      ownerUserId: "user-1",
      profile: null,
    });

    expect(() => assertAccountIdAvailable(existing)).toThrowError();

    try {
      assertAccountIdAvailable(existing);
    } catch (error) {
      expect(isAccountIdAlreadyTakenError(error)).toBe(true);
    }
  });

  it("スローされるエラーには衝突したaccountIdが入っている", () => {
    const existing = reconstructArtist({
      artistId: "artist-1",
      accountId: "taken_id",
      ownerUserId: "user-1",
      profile: null,
    });

    try {
      assertAccountIdAvailable(existing);
    } catch (error) {
      if (isAccountIdAlreadyTakenError(error)) {
        expect(error.accountId).toBe("taken_id");
      }
    }
  });
});
