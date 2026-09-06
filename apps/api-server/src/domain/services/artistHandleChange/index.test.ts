import { describe, it, expect } from "vitest";
import { changeArtistHandle } from "./index";
import { reconstructArtist } from "../../artists/factories";
import { createHandle } from "../../artists/valueObjects/handle";
import { isHandleAlreadyTakenError } from "../../artists/errors/handleAlreadyTaken";
import { unwrapOrThrow } from "../../../utils/result";

const artist = reconstructArtist({
  artistId: "artist-1",
  handle: "old_handle",
  ownerUserId: "user-1",
  profile: null,
});

const newHandle = unwrapOrThrow(createHandle("new_handle"), "invalid fixture");

describe("changeArtistHandle", () => {
  it("handle を差し替えた Artist と、旧 handle から新 handle への履歴を返す", () => {
    const result = changeArtistHandle(
      { artist, newHandle, changedByUserId: "member-9" },
      null,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.artist.getArtistId()).toBe("artist-1");
    expect(result.value.artist.getHandle()).toBe("new_handle");
    expect(result.value.history.toPersistence()).toStrictEqual({
      id: expect.any(String),
      artistId: "artist-1",
      oldHandle: "old_handle",
      newHandle: "new_handle",
      changedByUserId: "member-9",
    });
  });

  it("元の Artist は変更しない", () => {
    changeArtistHandle({ artist, newHandle, changedByUserId: "user-1" }, null);

    expect(artist.getHandle()).toBe("old_handle");
  });

  it("他の Artist が同じ handle を使っていれば HandleAlreadyTakenError を返す", () => {
    const taken = reconstructArtist({
      artistId: "artist-2",
      handle: "new_handle",
      ownerUserId: "user-2",
      profile: null,
    });

    const result = changeArtistHandle(
      { artist, newHandle, changedByUserId: "user-1" },
      taken,
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(isHandleAlreadyTakenError(result.error)).toBe(true);
    if (isHandleAlreadyTakenError(result.error)) {
      expect(result.error.handle).toBe("new_handle");
    }
  });
});
