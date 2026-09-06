import { describe, it, expect } from "vitest";
import { toAddressedActor, toAddressedUser } from "./index";
import { testUser as user, testArtist as artist } from "../testDoubles";

describe("toAddressedActor", () => {
  it("未登録は UserNotFoundError に畳み込む", () => {
    const result = toAddressedActor({ status: "unregistered" }, "artist-1");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("UserNotFoundError");
    }
  });

  it("user のみは ArtistNotFoundError に畳み込む", () => {
    const result = toAddressedActor({ status: "userOnly", user }, "artist-1");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("ArtistNotFoundError");
    }
  });

  it("指定した artistId が Actor の Artist と一致すれば ok で返す", () => {
    const result = toAddressedActor(
      { status: "complete", actor: { user, artist } },
      "artist-1",
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.artist.getArtistId()).toBe("artist-1");
    }
  });

  it("指定した artistId が一致しなければ ArtistNotFoundError に畳み込む（存在を秘匿）", () => {
    const result = toAddressedActor(
      { status: "complete", actor: { user, artist } },
      "other-artist",
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("ArtistNotFoundError");
    }
  });
});

describe("toAddressedUser", () => {
  it("未登録は UserNotFoundError に畳み込む", () => {
    const result = toAddressedUser({ status: "unregistered" }, "user-1");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("UserNotFoundError");
    }
  });

  it("指定した userId が本人と一致すれば ok で返す", () => {
    const result = toAddressedUser({ status: "userOnly", user }, "user-1");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.getId()).toBe("user-1");
    }
  });

  it("Actor が揃っていても userId が一致すれば ok で返す", () => {
    const result = toAddressedUser(
      { status: "complete", actor: { user, artist } },
      "user-1",
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.getId()).toBe("user-1");
    }
  });

  it("指定した userId が一致しなければ UserNotFoundError に畳み込む（存在を秘匿）", () => {
    const result = toAddressedUser({ status: "userOnly", user }, "other-user");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("UserNotFoundError");
    }
  });
});
