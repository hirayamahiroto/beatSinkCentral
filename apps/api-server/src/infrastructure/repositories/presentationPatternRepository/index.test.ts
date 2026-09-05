import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPresentationPatternReader } from "./index";

const createExecutor = (rows: { code: string; label: string }[]) => ({
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockResolvedValue(rows),
});

describe("createPresentationPatternReader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("表現パターンマスタを一覧で返す", async () => {
    const rows = [
      { code: "interview", label: "インタビュー" },
      { code: "editorial", label: "特集記事" },
    ];
    const executor = createExecutor(rows);

    const result = await createPresentationPatternReader(
      executor as never,
    ).findAll();

    expect(result).toStrictEqual(rows);
  });

  it("生成時に渡した executor で読み取る", async () => {
    const executor = createExecutor([]);

    await createPresentationPatternReader(executor as never).findAll();

    expect(executor.select).toHaveBeenCalledTimes(1);
    expect(executor.orderBy).toHaveBeenCalledTimes(1);
  });
});
