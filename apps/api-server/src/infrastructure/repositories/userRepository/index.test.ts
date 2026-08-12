import { describe, it, expect, vi, beforeEach } from "vitest";
import { createUserReader, createUserWriter } from "./index";

const mockDb = {
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  returning: vi.fn(),
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
};

const row = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  subId: "auth0|123456789",
  email: "test@example.com",
};

describe("createUserWriter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("save", () => {
    it("永続化したUserを返す", async () => {
      mockDb.returning.mockResolvedValue([row]);

      const result = await createUserWriter(mockDb as never).save(row);

      expect(mockDb.values).toHaveBeenCalledWith(row);
      expect(result.toPersistence()).toStrictEqual(row);
    });
  });

  describe("updateEmail", () => {
    it("更新後のUserを返す", async () => {
      const updated = { ...row, email: "new@example.com" };
      mockDb.returning.mockResolvedValue([updated]);

      const result = await createUserWriter(mockDb as never).updateEmail({
        id: row.id,
        email: "new@example.com",
      });

      expect(mockDb.set).toHaveBeenCalledWith({ email: "new@example.com" });
      expect(result.toPersistence()).toStrictEqual(updated);
    });
  });

  it("生成時に渡した executor で書き込む", async () => {
    const tx = {
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([row]),
    };

    const result = await createUserWriter(tx as never).save(row);

    expect(tx.insert).toHaveBeenCalledTimes(1);
    expect(mockDb.insert).not.toHaveBeenCalled();
    expect(result.toPersistence()).toStrictEqual(row);
  });
});

describe("createUserReader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("findBySub", () => {
    it("ユーザーが存在する場合はUserを返す", async () => {
      mockDb.limit.mockResolvedValue([row]);

      const result = await createUserReader(mockDb as never).findBySub(
        row.subId,
      );

      expect(result).not.toBeNull();
      expect(result?.toPersistence()).toStrictEqual(row);
    });

    it("ユーザーが存在しない場合はnullを返す", async () => {
      mockDb.limit.mockResolvedValue([]);

      const result = await createUserReader(mockDb as never).findBySub(
        "auth0|nonexistent",
      );

      expect(result).toBeNull();
    });
  });

  it("生成時に渡した executor で読み取る", async () => {
    const tx = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([row]),
    };

    const result = await createUserReader(tx as never).findBySub(row.subId);

    expect(tx.select).toHaveBeenCalledTimes(1);
    expect(mockDb.select).not.toHaveBeenCalled();
    expect(result?.toPersistence()).toStrictEqual(row);
  });
});
