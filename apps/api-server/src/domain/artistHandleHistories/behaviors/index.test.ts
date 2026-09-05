import { describe, it, expect } from "vitest";
import { createArtistHandleHistoryBehaviors } from "./index";
import type { ArtistHandleHistoryState } from "../entities";

const buildState = (
  overrides: Partial<ArtistHandleHistoryState> = {},
): ArtistHandleHistoryState => ({
  id: "history-1",
  artistId: "artist-1",
  oldHandle: "old_handle",
  newHandle: "new_handle",
  changedByUserId: "user-1",
  ...overrides,
});

describe("createArtistHandleHistoryBehaviors", () => {
  it("各 getter が state の値をそのまま返す", () => {
    const history = createArtistHandleHistoryBehaviors(buildState());

    expect(history.getId()).toBe("history-1");
    expect(history.getArtistId()).toBe("artist-1");
    expect(history.getOldHandle()).toBe("old_handle");
    expect(history.getNewHandle()).toBe("new_handle");
    expect(history.getChangedByUserId()).toBe("user-1");
  });

  it("toPersistence で旧 handle と新 handle を入れ替えずに永続化データへ渡す", () => {
    const state = buildState({ oldHandle: "before", newHandle: "after" });

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
