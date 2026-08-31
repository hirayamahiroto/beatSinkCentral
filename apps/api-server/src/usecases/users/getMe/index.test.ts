import { describe, it, expect } from "vitest";
import { getMe } from "./index";
import { reconstructUser } from "../../../domain/users/factories";
import { reconstructArtist } from "../../../domain/artists/factories";

const user = reconstructUser({
  id: "user-1",
  subId: "auth0|123",
  email: "test@example.com",
});

const artist = reconstructArtist({
  artistId: "artist-1",
  handle: "user_123",
  ownerUserId: "user-1",
  profile: { name: "Test" },
});

describe("getMe", () => {
  it("Actor が未登録の場合は registered:false を返す", async () => {
    const result = await getMe({ actorResolution: { status: "unregistered" } });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toStrictEqual({ registered: false });
    }
  });

  it("user のみ解決できた場合は artist:null を返す", async () => {
    const result = await getMe({
      actorResolution: { status: "userOnly", user },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toStrictEqual({
        registered: true,
        userId: "user-1",
        email: "test@example.com",
        artist: null,
      });
    }
  });

  it("Actor が揃っている場合は artist 情報を返す", async () => {
    const result = await getMe({
      actorResolution: { status: "complete", actor: { user, artist } },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toStrictEqual({
        registered: true,
        userId: "user-1",
        email: "test@example.com",
        artist: {
          artistId: "artist-1",
          handle: "user_123",
          hasProfile: true,
        },
      });
    }
  });
});
