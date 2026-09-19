import { describe, it, expect, vi, beforeEach } from "vitest";
import { createStoryQuestionReader } from "./index";

const createExecutor = (rows: { code: string; label: string }[]) => ({
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockResolvedValue(rows),
});

describe("createStoryQuestionReader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("問いマスタを sortOrder 順で返す", async () => {
    const rows = [
      { code: "beginning", label: "始まり" },
      { code: "turning_point", label: "転機" },
      { code: "concept", label: "何を表現したいのか" },
    ];
    const executor = createExecutor(rows);

    const result = await createStoryQuestionReader(executor as never).findAll();

    expect(result).toStrictEqual(rows);
  });

  it("生成時に渡した executor で読み取り、sortOrder で並べる", async () => {
    const executor = createExecutor([]);

    await createStoryQuestionReader(executor as never).findAll();

    expect(executor.select).toHaveBeenCalledTimes(1);
    expect(executor.orderBy).toHaveBeenCalledTimes(1);
  });
});
