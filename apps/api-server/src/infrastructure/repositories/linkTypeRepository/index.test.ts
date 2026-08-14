import { describe, it, expect, vi, beforeEach } from "vitest";
import { createLinkTypeReader } from "./index";

const createExecutor = (rows: { type: string; label: string }[]) => ({
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockResolvedValue(rows),
});

describe("createLinkTypeReader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("リンク種別マスタを一覧で返す", async () => {
    const rows = [
      { type: "youtube", label: "YouTube" },
      { type: "x", label: "X" },
    ];
    const executor = createExecutor(rows);

    const result = await createLinkTypeReader(executor as never).findAll();

    expect(result).toStrictEqual(rows);
  });

  it("生成時に渡した executor で読み取る", async () => {
    const executor = createExecutor([]);

    await createLinkTypeReader(executor as never).findAll();

    expect(executor.select).toHaveBeenCalledTimes(1);
    expect(executor.orderBy).toHaveBeenCalledTimes(1);
  });
});
