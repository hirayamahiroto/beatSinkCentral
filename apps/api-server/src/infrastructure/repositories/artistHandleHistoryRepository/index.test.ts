import { describe, it, expect, vi, beforeEach } from "vitest";
import { createArtistHandleHistoryWriter } from "./index";
import type { ArtistHandleHistoryPersistenceData } from "../../../domain/artistHandleHistories/entities";

const createExecutor = () => ({
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockResolvedValue(undefined),
});

const data: ArtistHandleHistoryPersistenceData = {
  id: "history-1",
  artistId: "artist-1",
  oldHandle: "old_handle",
  newHandle: "new_handle",
  changedByUserId: "user-1",
};

describe("createArtistHandleHistoryWriter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("生成時に渡した executor で全フィールドを insert する", async () => {
    const executor = createExecutor();

    await createArtistHandleHistoryWriter(executor as never).record(data);

    expect(executor.insert).toHaveBeenCalledTimes(1);
    expect(executor.values).toHaveBeenCalledExactlyOnceWith({
      id: "history-1",
      artistId: "artist-1",
      oldHandle: "old_handle",
      newHandle: "new_handle",
      changedByUserId: "user-1",
    });
  });

  it("insert の失敗はそのまま伝播する", async () => {
    const executor = createExecutor();
    const failure = new Error("connection terminated");
    executor.values.mockRejectedValue(failure);

    await expect(
      createArtistHandleHistoryWriter(executor as never).record(data),
    ).rejects.toBe(failure);
  });
});
