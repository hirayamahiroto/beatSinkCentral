import { describe, it, expect, vi, beforeEach } from "vitest";
import { createArtistReader, createArtistWriter } from "./index";
import type {
  IArtistReader,
  IArtistWriter,
} from "../../../domain/artists/repositories";

const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  innerJoin: vi.fn().mockReturnThis(),
  leftJoin: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  returning: vi.fn(),
};

const createUniqueViolation = (constraintName: string): Error =>
  Object.assign(new Error("duplicate key value violates unique constraint"), {
    code: "23505",
    constraint_name: constraintName,
  });

describe("createArtistReader / createArtistWriter", () => {
  let reader: IArtistReader;
  let writer: IArtistWriter;

  beforeEach(() => {
    vi.clearAllMocks();
    reader = createArtistReader(mockDb as never);
    writer = createArtistWriter(mockDb as never);
  });

  describe("findByUserId", () => {
    it("profile有りのartistを返す", async () => {
      mockDb.limit.mockResolvedValue([
        {
          artistId: "artist-1",
          handle: "user_123",
          profileName: "Test Artist",
        },
      ]);

      const result = await reader.findByUserId("user-1");

      expect(result).not.toBeNull();
      expect(result?.getArtistId()).toBe("artist-1");
      expect(result?.getHandle()).toBe("user_123");
      expect(result?.hasProfile()).toBe(true);
    });

    it("profileなしのartistはprofile:nullで返す", async () => {
      mockDb.limit.mockResolvedValue([
        {
          artistId: "artist-1",
          handle: "user_123",
          profileName: null,
        },
      ]);

      const result = await reader.findByUserId("user-1");

      expect(result?.hasProfile()).toBe(false);
    });

    it("見つからない場合はnullを返す", async () => {
      mockDb.limit.mockResolvedValue([]);

      const result = await reader.findByUserId("user-unknown");

      expect(result).toBeNull();
    });

    it("artistOwners/artists/artistProfilesを結合してuserIdで1件取得する", async () => {
      mockDb.limit.mockResolvedValue([]);

      await reader.findByUserId("user-1");

      expect(mockDb.select).toHaveBeenCalledTimes(1);
      expect(mockDb.from).toHaveBeenCalledTimes(1);
      expect(mockDb.innerJoin).toHaveBeenCalledTimes(1);
      expect(mockDb.leftJoin).toHaveBeenCalledTimes(1);
      expect(mockDb.where).toHaveBeenCalledTimes(1);
      expect(mockDb.limit).toHaveBeenCalledWith(1);
    });
  });

  describe("findByHandle", () => {
    it("該当するartistを返す", async () => {
      mockDb.limit.mockResolvedValue([
        {
          artistId: "artist-1",
          handle: "user_123",
          ownerUserId: "user-1",
          profileName: "Test Artist",
        },
      ]);

      const result = await reader.findByHandle("user_123");

      expect(result).not.toBeNull();
      expect(result?.getArtistId()).toBe("artist-1");
      expect(result?.getHandle()).toBe("user_123");
      expect(result?.toPersistence().ownerUserId).toBe("user-1");
    });

    it("見つからない場合はnullを返す", async () => {
      mockDb.limit.mockResolvedValue([]);

      const result = await reader.findByHandle("unknown_account");

      expect(result).toBeNull();
    });

    it("artistsを起点にartistOwners/artistProfilesを結合してhandleで1件取得する", async () => {
      mockDb.limit.mockResolvedValue([]);

      await reader.findByHandle("user_123");

      expect(mockDb.select).toHaveBeenCalledTimes(1);
      expect(mockDb.from).toHaveBeenCalledTimes(1);
      expect(mockDb.innerJoin).toHaveBeenCalledTimes(1);
      expect(mockDb.leftJoin).toHaveBeenCalledTimes(1);
      expect(mockDb.where).toHaveBeenCalledTimes(1);
      expect(mockDb.limit).toHaveBeenCalledWith(1);
    });
  });

  describe("findByHandles", () => {
    it("handle が空ならクエリを発行せず空配列を返す", async () => {
      const result = await reader.findByHandles([]);

      expect(result).toEqual([]);
      expect(mockDb.select).not.toHaveBeenCalled();
    });

    it("複数の handle を IN 句の 1 クエリで引き、該当した artist だけを返す", async () => {
      mockDb.where.mockResolvedValueOnce([
        {
          artistId: "artist-2",
          handle: "hana_bb",
          ownerUserId: "user-2",
          profileName: "Hana",
        },
        {
          artistId: "artist-3",
          handle: "ken_bb",
          ownerUserId: "user-3",
          profileName: null,
        },
      ]);

      const result = await reader.findByHandles(["hana_bb", "ken_bb", "none"]);

      expect(mockDb.select).toHaveBeenCalledTimes(1);
      expect(mockDb.where).toHaveBeenCalledTimes(1);
      expect(mockDb.limit).not.toHaveBeenCalled();
      expect(result.map((artist) => artist.getArtistId())).toEqual([
        "artist-2",
        "artist-3",
      ]);
      expect(result[0].getHandle()).toBe("hana_bb");
      expect(result[0].hasProfile()).toBe(true);
      expect(result[1].hasProfile()).toBe(false);
    });
  });

  describe("updateHandle", () => {
    it("handle 更新後の Artist を返す（profile あり）", async () => {
      mockDb.returning.mockResolvedValue([
        { id: "artist-1", handle: "new_handle" },
      ]);
      mockDb.limit
        .mockResolvedValueOnce([{ userId: "user-1" }])
        .mockResolvedValueOnce([{ name: "Test Artist" }]);

      const result = await writer.updateHandle({
        artistId: "artist-1",
        handle: "new_handle",
      });

      expect(mockDb.set).toHaveBeenCalledWith({ handle: "new_handle" });
      expect(result.getArtistId()).toBe("artist-1");
      expect(result.getHandle()).toBe("new_handle");
      expect(result.toPersistence().ownerUserId).toBe("user-1");
    });

    it("profile が無い場合は profile:null で返す", async () => {
      mockDb.returning.mockResolvedValue([
        { id: "artist-1", handle: "new_handle" },
      ]);
      mockDb.limit
        .mockResolvedValueOnce([{ userId: "user-1" }])
        .mockResolvedValueOnce([]);

      const result = await writer.updateHandle({
        artistId: "artist-1",
        handle: "new_handle",
      });

      expect(result.hasProfile()).toBe(false);
    });

    it("handle の一意制約違反を HandleAlreadyTakenError に変換して throw する", async () => {
      mockDb.returning.mockRejectedValue(
        createUniqueViolation("artists_handle_unique"),
      );

      await expect(
        writer.updateHandle({
          artistId: "artist-1",
          handle: "taken_handle",
        }),
      ).rejects.toMatchObject({
        type: "HandleAlreadyTakenError",
        handle: "taken_handle",
      });
    });

    it("一意制約違反以外のエラーはそのまま伝播する", async () => {
      const connectionError = new Error("connection terminated");
      mockDb.returning.mockRejectedValue(connectionError);

      await expect(
        writer.updateHandle({
          artistId: "artist-1",
          handle: "new_handle",
        }),
      ).rejects.toBe(connectionError);
    });
  });

  describe("save", () => {
    it("handle の一意制約違反を HandleAlreadyTakenError に変換して throw する", async () => {
      mockDb.returning.mockRejectedValue(
        createUniqueViolation("artists_handle_unique"),
      );

      await expect(
        writer.save({
          id: "artist-1",
          handle: "taken_handle",
          ownerUserId: "user-1",
        }),
      ).rejects.toMatchObject({
        type: "HandleAlreadyTakenError",
        handle: "taken_handle",
      });
    });
  });
});

describe("artists の executor 束ね", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("生成時に渡した executor で読み取る", async () => {
    const tx = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([
        {
          artistId: "artist-1",
          handle: "user_123",
          ownerUserId: "user-1",
          profileName: null,
        },
      ]),
    };

    const result = await createArtistReader(tx as never).findByUserId("user-1");

    expect(tx.select).toHaveBeenCalledTimes(1);
    expect(mockDb.select).not.toHaveBeenCalled();
    expect(result?.getArtistId()).toBe("artist-1");
  });

  it("生成時に渡した executor で書き込む", async () => {
    const tx = {
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi
        .fn()
        .mockResolvedValue([{ id: "artist-1", handle: "user_123" }]),
    };

    const result = await createArtistWriter(tx as never).save({
      id: "artist-1",
      handle: "user_123",
      ownerUserId: "user-1",
    });

    expect(tx.insert).toHaveBeenCalledTimes(2);
    expect(mockDb.insert).not.toHaveBeenCalled();
    expect(result.getHandle()).toBe("user_123");
  });
});
