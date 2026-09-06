import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateMyHandle } from "./index";
import {
  createHandleAlreadyTakenError,
  isHandleAlreadyTakenError,
} from "../../../domain/artists/errors/handleAlreadyTaken";
import { reconstructUser } from "../../../domain/users/factories";
import { reconstructArtist } from "../../../domain/artists/factories";
import type {
  IArtistReader,
  IArtistWriter,
} from "../../../domain/artists/repositories";
import type { IArtistHandleHistoryWriter } from "../../../domain/artistHandleHistories/repositories";
import type { ArtistWriteCapabilities } from "../../capabilities";

const user = reconstructUser({
  id: "550e8400-e29b-41d4-a716-446655440000",
  subId: "auth0|123456789",
  email: "test@example.com",
});

const artist = reconstructArtist({
  artistId: "artist-1",
  handle: "old_handle",
  ownerUserId: "owner-user-1",
  profile: null,
});

const createCaps = () =>
  ({
    actor: { user, artist },
    artists: {
      findByUserId: vi.fn<IArtistReader["findByUserId"]>(async () => null),
      findByHandle: vi.fn<IArtistReader["findByHandle"]>(async () => null),
      save: vi.fn<IArtistWriter["save"]>(),
      updateHandle: vi.fn<IArtistWriter["updateHandle"]>(),
    },
    artistHandleHistories: {
      record: vi.fn<IArtistHandleHistoryWriter["record"]>(
        async () => undefined,
      ),
    },
  }) satisfies Pick<
    ArtistWriteCapabilities,
    "actor" | "artists" | "artistHandleHistories"
  >;

const renamedArtist = reconstructArtist({
  artistId: artist.getArtistId(),
  handle: "new_handle",
  ownerUserId: artist.toPersistence().ownerUserId,
  profile: null,
});

describe("updateMyHandle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Actor の handle を更新し、新しい handle を返す", async () => {
    const caps = createCaps();
    caps.artists.updateHandle.mockResolvedValue(renamedArtist);

    const result = await updateMyHandle(caps, { handle: "new_handle" });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toStrictEqual({
        artistId: artist.getArtistId(),
        handle: "new_handle",
      });
    }
    expect(caps.artists.updateHandle).toHaveBeenCalledExactlyOnceWith({
      artistId: artist.getArtistId(),
      handle: "new_handle",
    });
  });

  it("handle 変更時に旧 handle・新 handle・変更者を履歴として記録する", async () => {
    const caps = createCaps();
    caps.artists.updateHandle.mockResolvedValue(renamedArtist);

    await updateMyHandle(caps, { handle: "new_handle" });

    expect(caps.artistHandleHistories.record).toHaveBeenCalledExactlyOnceWith({
      id: expect.any(String),
      artistId: artist.getArtistId(),
      oldHandle: "old_handle",
      newHandle: "new_handle",
      changedByUserId: user.getId(),
    });
  });

  it("現在の handle と同じ値の場合は更新せず early return する", async () => {
    const caps = createCaps();

    const result = await updateMyHandle(caps, { handle: "old_handle" });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toStrictEqual({
        artistId: artist.getArtistId(),
        handle: "old_handle",
      });
    }
    expect(caps.artists.findByHandle).not.toHaveBeenCalled();
    expect(caps.artists.updateHandle).not.toHaveBeenCalled();
    expect(caps.artistHandleHistories.record).not.toHaveBeenCalled();
  });

  it("他の artist が同じ handle を使用している場合は HandleAlreadyTakenError を err で返す", async () => {
    const caps = createCaps();
    caps.artists.findByHandle.mockResolvedValue(
      reconstructArtist({
        artistId: "artist-2",
        handle: "new_handle",
        ownerUserId: "other-user",
        profile: null,
      }),
    );

    const result = await updateMyHandle(caps, { handle: "new_handle" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(isHandleAlreadyTakenError(result.error)).toBe(true);
      if (isHandleAlreadyTakenError(result.error)) {
        expect(result.error.handle).toBe("new_handle");
      }
    }
    expect(caps.artists.updateHandle).not.toHaveBeenCalled();
    expect(caps.artistHandleHistories.record).not.toHaveBeenCalled();
  });

  it("handle が不正な形式の場合は参照せず InvalidHandleFormatError を err で返す", async () => {
    const caps = createCaps();

    const result = await updateMyHandle(caps, {
      handle: "invalid handle",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidHandleFormatError");
    }
    expect(caps.artists.findByHandle).not.toHaveBeenCalled();
    expect(caps.artists.updateHandle).not.toHaveBeenCalled();
    expect(caps.artistHandleHistories.record).not.toHaveBeenCalled();
  });

  it("更新時の一意制約違反はそのまま伝播し、履歴を記録しない", async () => {
    const caps = createCaps();
    const takenError = createHandleAlreadyTakenError("new_handle");
    caps.artists.updateHandle.mockRejectedValue(takenError);

    await expect(updateMyHandle(caps, { handle: "new_handle" })).rejects.toBe(
      takenError,
    );
    expect(caps.artistHandleHistories.record).not.toHaveBeenCalled();
  });
});
