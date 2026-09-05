import { describe, it, expect, vi, afterEach } from "vitest";
import { createArtistHandleHistory } from "./index";

const params = {
  artistId: "artist-1",
  oldHandle: "old_handle",
  newHandle: "new_handle",
  changedByUserId: "user-2",
};

describe("createArtistHandleHistory", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("id を採番し、渡した値を入れ替えずに永続化データへ渡す", () => {
    vi.spyOn(crypto, "randomUUID").mockReturnValue(
      "11111111-1111-4111-8111-111111111111",
    );

    expect(createArtistHandleHistory(params).toPersistence()).toStrictEqual({
      id: "11111111-1111-4111-8111-111111111111",
      artistId: "artist-1",
      oldHandle: "old_handle",
      newHandle: "new_handle",
      changedByUserId: "user-2",
    });
  });

  it("呼び出しごとに異なる id を採番する", () => {
    expect(createArtistHandleHistory(params).getId()).not.toBe(
      createArtistHandleHistory(params).getId(),
    );
  });
});
