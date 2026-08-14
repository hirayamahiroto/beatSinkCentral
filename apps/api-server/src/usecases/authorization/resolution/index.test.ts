import { describe, it, expect } from "vitest";
import { toActor, toUser } from "./index";
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
