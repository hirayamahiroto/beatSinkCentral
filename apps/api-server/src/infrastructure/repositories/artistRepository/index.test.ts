import { describe, it, expect, vi, beforeEach } from "vitest";
import { createArtistRepository } from "./index";
import type { IArtistRepository } from "../../../domain/artists/repositories";
import { isArtistNotFoundError } from "../../../domain/artists/policies/assertArtistExists";

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

describe("createArtistRepository", () => {
  let repository: IArtistRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = createArtistRepository(mockDb as never);
  });

  describe("save", () => {
    it("永続化した Artist を返す", async () => {
      mockDb.returning.mockResolvedValue([
        { id: "artist-1", accountId: "user_123" },
      ]);

      const result = await repository.save({
        id: "artist-1",
        accountId: "user_123",
        ownerUserId: "user-1",
        profile: null,
      });

      expect(result.getArtistId()).toBe("artist-1");
      expect(result.getAccountId()).toBe("user_123");
      expect(result.getOwnerUserId()).toBe("user-1");
      expect(result.getProfile()).toBeNull();
    });

    it("INSERT の returning が空の場合は素 Error を throw する (DB 契約違反 = 500 化対象)", async () => {
      mockDb.returning.mockResolvedValue([]);

      const promise = repository.save({
        id: "artist-1",
        accountId: "user_123",
        ownerUserId: "user-1",
        profile: null,
      });

      await expect(promise).rejects.toThrow(/empty returning from insert/);
      await expect(promise).rejects.not.toSatisfy(isArtistNotFoundError);
    });
  });

  describe("findByUserId", () => {
    it("profile有りのartistを返す", async () => {
      mockDb.limit.mockResolvedValue([
        {
          artistId: "artist-1",
          accountId: "user_123",
          profileName: "Test Artist",
        },
      ]);

      const result = await repository.findByUserId("user-1");

      expect(result).not.toBeNull();
      expect(result?.getArtistId()).toBe("artist-1");
      expect(result?.getAccountId()).toBe("user_123");
      expect(result?.getProfile()).toStrictEqual({ name: "Test Artist" });
      expect(result?.hasProfile()).toBe(true);
    });

    it("profileなしのartistはprofile:nullで返す", async () => {
      mockDb.limit.mockResolvedValue([
        {
          artistId: "artist-1",
          accountId: "user_123",
          profileName: null,
        },
      ]);

      const result = await repository.findByUserId("user-1");

      expect(result?.hasProfile()).toBe(false);
      expect(result?.getProfile()).toBeNull();
    });

    it("見つからない場合はnullを返す", async () => {
      mockDb.limit.mockResolvedValue([]);

      const result = await repository.findByUserId("user-unknown");

      expect(result).toBeNull();
    });

    it("artistOwners/artists/artistProfilesを結合してuserIdで1件取得する", async () => {
      mockDb.limit.mockResolvedValue([]);

      await repository.findByUserId("user-1");

      expect(mockDb.select).toHaveBeenCalledTimes(1);
      expect(mockDb.from).toHaveBeenCalledTimes(1);
      expect(mockDb.innerJoin).toHaveBeenCalledTimes(1);
      expect(mockDb.leftJoin).toHaveBeenCalledTimes(1);
      expect(mockDb.where).toHaveBeenCalledTimes(1);
      expect(mockDb.limit).toHaveBeenCalledWith(1);
    });
  });

  describe("findByAccountId", () => {
    it("該当するartistを返す", async () => {
      mockDb.limit.mockResolvedValue([
        {
          artistId: "artist-1",
          accountId: "user_123",
          ownerUserId: "user-1",
          profileName: "Test Artist",
        },
      ]);

      const result = await repository.findByAccountId("user_123");

      expect(result).not.toBeNull();
      expect(result?.getArtistId()).toBe("artist-1");
      expect(result?.getAccountId()).toBe("user_123");
      expect(result?.getOwnerUserId()).toBe("user-1");
      expect(result?.getProfile()).toStrictEqual({ name: "Test Artist" });
    });

    it("見つからない場合はnullを返す", async () => {
      mockDb.limit.mockResolvedValue([]);

      const result = await repository.findByAccountId("unknown_account");

      expect(result).toBeNull();
    });

    it("artistsを起点にartistOwners/artistProfilesを結合してaccountIdで1件取得する", async () => {
      mockDb.limit.mockResolvedValue([]);

      await repository.findByAccountId("user_123");

      expect(mockDb.select).toHaveBeenCalledTimes(1);
      expect(mockDb.from).toHaveBeenCalledTimes(1);
      expect(mockDb.innerJoin).toHaveBeenCalledTimes(1);
      expect(mockDb.leftJoin).toHaveBeenCalledTimes(1);
      expect(mockDb.where).toHaveBeenCalledTimes(1);
      expect(mockDb.limit).toHaveBeenCalledWith(1);
    });
  });

  describe("updateAccountId", () => {
    it("accountId 更新後の Artist を返す（profile あり）", async () => {
      mockDb.returning.mockResolvedValue([
        { id: "artist-1", accountId: "new_handle" },
      ]);
      mockDb.limit
        .mockResolvedValueOnce([{ userId: "user-1" }])
        .mockResolvedValueOnce([{ name: "Test Artist" }]);

      const result = await repository.updateAccountId({
        artistId: "artist-1",
        accountId: "new_handle",
      });

      expect(mockDb.set).toHaveBeenCalledWith({ accountId: "new_handle" });
      expect(result.getArtistId()).toBe("artist-1");
      expect(result.getAccountId()).toBe("new_handle");
      expect(result.getOwnerUserId()).toBe("user-1");
      expect(result.getProfile()).toStrictEqual({ name: "Test Artist" });
    });

    it("profile が無い場合は profile:null で返す", async () => {
      mockDb.returning.mockResolvedValue([
        { id: "artist-1", accountId: "new_handle" },
      ]);
      mockDb.limit
        .mockResolvedValueOnce([{ userId: "user-1" }])
        .mockResolvedValueOnce([]);

      const result = await repository.updateAccountId({
        artistId: "artist-1",
        accountId: "new_handle",
      });

      expect(result.hasProfile()).toBe(false);
      expect(result.getProfile()).toBeNull();
    });

    it("UPDATE 結果が空の場合は ArtistNotFoundError を throw する", async () => {
      mockDb.returning.mockResolvedValue([]);

      const promise = repository.updateAccountId({
        artistId: "artist-unknown",
        accountId: "new_handle",
      });

      await expect(promise).rejects.toSatisfy(isArtistNotFoundError);
    });

    it("owner 行が見つからない場合はデータ整合性違反として Error を throw する", async () => {
      mockDb.returning.mockResolvedValue([
        { id: "artist-1", accountId: "new_handle" },
      ]);
      mockDb.limit.mockResolvedValueOnce([]);

      const promise = repository.updateAccountId({
        artistId: "artist-1",
        accountId: "new_handle",
      });

      // ArtistNotFoundError ではなく、errorMap に登録しない素の Error (500 化対象)
      await expect(promise).rejects.toThrow(/owner row missing/);
      await expect(promise).rejects.not.toSatisfy(isArtistNotFoundError);
    });
  });
});
