import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateMyAccountId } from "./index";
import {
  createAccountIdAlreadyTakenError,
  isAccountIdAlreadyTakenError,
} from "../../../domain/artists/errors/accountIdAlreadyTaken";
import { reconstructUser } from "../../../domain/users/factories";
import { reconstructArtist } from "../../../domain/artists/factories";
import type {
  IArtistReader,
  IArtistWriter,
} from "../../../domain/artists/repositories";
import type { WriteCapabilities } from "../../capabilities";

const user = reconstructUser({
  id: "550e8400-e29b-41d4-a716-446655440000",
  subId: "auth0|123456789",
  email: "test@example.com",
});

const artist = reconstructArtist({
  artistId: "artist-1",
  accountId: "old_handle",
  ownerUserId: user.getId(),
  profile: null,
});

const createCaps = () =>
  ({
    actor: { user, artist },
    artists: {
      findByUserId: vi.fn<IArtistReader["findByUserId"]>(async () => null),
      findByAccountId: vi.fn<IArtistReader["findByAccountId"]>(
        async () => null,
      ),
      save: vi.fn<IArtistWriter["save"]>(),
      updateAccountId: vi.fn<IArtistWriter["updateAccountId"]>(),
    },
  }) satisfies Pick<WriteCapabilities, "actor" | "artists">;

const renamedArtist = reconstructArtist({
  artistId: artist.getArtistId(),
  accountId: "new_handle",
  ownerUserId: artist.getOwnerUserId(),
  profile: null,
});

describe("updateMyAccountId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Actor の accountId を更新し、新しい accountId を返す", async () => {
    const caps = createCaps();
    caps.artists.updateAccountId.mockResolvedValue(renamedArtist);

    const result = await updateMyAccountId(caps, { accountId: "new_handle" });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toStrictEqual({
        artistId: artist.getArtistId(),
        accountId: "new_handle",
      });
    }
    expect(caps.artists.updateAccountId).toHaveBeenCalledTimes(1);
  });

  it("現在の accountId と同じ値の場合は更新せず early return する", async () => {
    const caps = createCaps();

    const result = await updateMyAccountId(caps, { accountId: "old_handle" });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toStrictEqual({
        artistId: artist.getArtistId(),
        accountId: "old_handle",
      });
    }
    expect(caps.artists.findByAccountId).not.toHaveBeenCalled();
    expect(caps.artists.updateAccountId).not.toHaveBeenCalled();
  });

  it("他の artist が同じ accountId を使用している場合は AccountIdAlreadyTakenError を err で返す", async () => {
    const caps = createCaps();
    caps.artists.findByAccountId.mockResolvedValue(
      reconstructArtist({
        artistId: "artist-2",
        accountId: "new_handle",
        ownerUserId: "other-user",
        profile: null,
      }),
    );

    const result = await updateMyAccountId(caps, { accountId: "new_handle" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(isAccountIdAlreadyTakenError(result.error)).toBe(true);
    }
    expect(caps.artists.updateAccountId).not.toHaveBeenCalled();
  });

  it("accountId が不正な形式の場合は参照せず InvalidAccountIdFormatError を err で返す", async () => {
    const caps = createCaps();

    const result = await updateMyAccountId(caps, {
      accountId: "invalid handle",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidAccountIdFormatError");
    }
    expect(caps.artists.findByAccountId).not.toHaveBeenCalled();
    expect(caps.artists.updateAccountId).not.toHaveBeenCalled();
  });

  it("更新時の一意制約違反はそのまま伝播する", async () => {
    const caps = createCaps();
    const takenError = createAccountIdAlreadyTakenError("new_handle");
    caps.artists.updateAccountId.mockRejectedValue(takenError);

    await expect(
      updateMyAccountId(caps, { accountId: "new_handle" }),
    ).rejects.toBe(takenError);
  });
});
