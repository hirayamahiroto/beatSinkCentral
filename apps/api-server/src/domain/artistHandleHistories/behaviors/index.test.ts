import { describe, it, expect } from "vitest";
import { createArtistHandleHistoryBehaviors } from "./index";
import type { ArtistHandleHistoryState } from "../entities";

const state: ArtistHandleHistoryState = {
  id: "history-1",
  artistId: "artist-1",
  oldHandle: "before",
  newHandle: "after",
  changedByUserId: "user-1",
};

describe("createArtistHandleHistoryBehaviors", () => {
  it("toPersistence で旧 handle と新 handle を入れ替えずに永続化データへ渡す", () => {
    expect(
      createArtistHandleHistoryBehaviors(state).toPersistence(),
    ).toStrictEqual({
      id: "history-1",
      artistId: "artist-1",
      oldHandle: "before",
      newHandle: "after",
      changedByUserId: "user-1",
    });
  });
});
