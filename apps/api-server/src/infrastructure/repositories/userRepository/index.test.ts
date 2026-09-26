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

const createUniqueViolation = (constraintName: string): Error =>
  Object.assign(new Error("duplicate key value violates unique constraint"), {
    code: "23505",
    constraint_name: constraintName,
  });

describe("createUserWriter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("save", () => {
    it("永続化したUserを返す", async () => {
      mockDb.returning.mockResolvedValue([row]);

      const result = await createUserWriter(mockDb).save(row);

      expect(mockDb.values).toHaveBeenCalledWith(row);
      expect(result.toPersistence()).toStrictEqual(row);
    });
  });

  describe("updateEmail", () => {
    it("更新後のUserを返す", async () => {
      const updated = { ...row, email: "new@example.com" };
      mockDb.returning.mockResolvedValue([updated]);

      const result = await createUserWriter(mockDb).updateEmail({
        id: row.id,
        email: "new@example.com",
      });

      expect(mockDb.set).toHaveBeenCalledWith({ email: "new@example.com" });
      expect(result.toPersistence()).toStrictEqual(updated);
    });
  });

  describe("email の一意制約違反", () => {
    it("save では EmailAlreadyTakenError を throw する", async () => {
      mockDb.returning.mockRejectedValue(
        createUniqueViolation("users_email_unique"),
      );

      await expect(createUserWriter(mockDb).save(row)).rejects.toMatchObject({
        type: "EmailAlreadyTakenError",
      });
    });

    it("updateEmail では EmailAlreadyTakenError を throw する", async () => {
      mockDb.returning.mockRejectedValue(
        createUniqueViolation("users_email_unique"),
      );

      await expect(
        createUserWriter(mockDb).updateEmail({
          id: row.id,
          email: "taken@example.com",
        }),
      ).rejects.toMatchObject({ type: "EmailAlreadyTakenError" });
    });

    it("email 以外の制約違反はそのまま伝播する", async () => {
      const subIdViolation = createUniqueViolation("users_sub_id_unique");
      mockDb.returning.mockRejectedValue(subIdViolation);

      await expect(createUserWriter(mockDb).save(row)).rejects.toBe(
        subIdViolation,
      );
    });
  });

  it("生成時に渡した executor で書き込む", async () => {
    const tx = {
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([row]),
      update: vi.fn(),
    };

    const result = await createUserWriter(tx).save(row);

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

      const result = await createUserReader(mockDb).findBySub(row.subId);

      expect(result).not.toBeNull();
      expect(result?.toPersistence()).toStrictEqual(row);
    });

    it("ユーザーが存在しない場合はnullを返す", async () => {
      mockDb.limit.mockResolvedValue([]);

      const result =
        await createUserReader(mockDb).findBySub("auth0|nonexistent");

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

    const result = await createUserReader(tx).findBySub(row.subId);

    expect(tx.select).toHaveBeenCalledTimes(1);
    expect(mockDb.select).not.toHaveBeenCalled();
    expect(result?.toPersistence()).toStrictEqual(row);
  });
});
