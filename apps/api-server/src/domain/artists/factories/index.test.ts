import { describe, it, expect } from "vitest";
import { createArtist, reconstructArtist } from "./index";

describe("Artist Factory", () => {
  describe("createArtist", () => {
    it("有効なパラメータでArtistを作成する", () => {
      const result = createArtist({
        handle: "user_123",
        ownerUserId: "user-1",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.getHandle()).toBe("user_123");
        expect(result.value.getOwnerUserId()).toBe("user-1");
        expect(result.value.getArtistId()).toEqual(expect.any(String));
        expect(result.value.hasProfile()).toBe(false);
      }
    });

    it("無効なhandleは InvalidHandleFormatError を err で返す", () => {
      const result = createArtist({
        handle: "invalid handle",
        ownerUserId: "user-1",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("InvalidHandleFormatError");
      }
    });
  });

  describe("reconstructArtist", () => {
    const baseParams = {
      artistId: "artist-1",
      handle: "user_123",
      ownerUserId: "user-1",
      profile: null,
    };

    it("有効なパラメータでArtistを再構築できる", () => {
      const artist = reconstructArtist(baseParams);

      expect(artist.getArtistId()).toBe("artist-1");
      expect(artist.getHandle()).toBe("user_123");
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

    it("保存値が不正なら throw する（DB 復元の破綻は例外で落とす）", () => {
      expect(() =>
        reconstructArtist({ ...baseParams, handle: "invalid handle" }),
      ).toThrow();
    });
  });
});
