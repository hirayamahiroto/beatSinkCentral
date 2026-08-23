import { describe, it, expect } from "vitest";
import { toActor, toAddressedActor, toUser, toAddressedUser } from "./index";
import { testUser as user, testArtist as artist } from "../testDoubles";
import { isUserNotFoundError } from "../../../domain/users/errors/userNotFound";
import { isArtistNotFoundError } from "../../../domain/artists/errors/artistNotFound";

describe("toActor", () => {
  it("未登録は UserNotFoundError に畳み込む", () => {
    const result = toActor({ status: "unregistered" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(isUserNotFoundError(result.error)).toBe(true);
    }
  });

  it("user のみは ArtistNotFoundError に畳み込む", () => {
    const result = toActor({ status: "userOnly", user });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(isArtistNotFoundError(result.error)).toBe(true);
    }
  });

  it("Actor が揃っていれば ok で返す", () => {
    const result = toActor({ status: "complete", actor: { user, artist } });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.user.getId()).toBe("user-1");
      expect(result.value.artist.getArtistId()).toBe("artist-1");
    }
  });
});

describe("toAddressedActor", () => {
  it("未登録は UserNotFoundError に畳み込む", () => {
    const result = toAddressedActor({ status: "unregistered" }, "artist-1");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(isUserNotFoundError(result.error)).toBe(true);
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
      expect(isArtistNotFoundError(result.error)).toBe(true);
    }
  });
});

describe("toUser", () => {
  it("未登録は UserNotFoundError に畳み込む", () => {
    const result = toUser({ status: "unregistered" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(isUserNotFoundError(result.error)).toBe(true);
    }
  });

  it("user のみでも ok で返す", () => {
    const result = toUser({ status: "userOnly", user });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.getId()).toBe("user-1");
    }
  });

  it("Actor が揃っていれば user を取り出して ok で返す", () => {
    const result = toUser({ status: "complete", actor: { user, artist } });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.getId()).toBe("user-1");
    }
  });
});

describe("toAddressedUser", () => {
  it("未登録は UserNotFoundError に畳み込む", () => {
    const result = toAddressedUser({ status: "unregistered" }, "user-1");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(isUserNotFoundError(result.error)).toBe(true);
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
      expect(isUserNotFoundError(result.error)).toBe(true);
    }
  });
});
