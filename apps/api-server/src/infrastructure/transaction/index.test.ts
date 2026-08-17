import { describe, it, expect, vi } from "vitest";
import { runInTransaction } from "./index";
import { ok, err } from "../../utils/result";
import type { DatabaseClient } from "database";

const createDbStub = () => {
  const tx = { marker: "tx" };
  const calls = { rolledBack: false };

  const db: DatabaseClient = {
    transaction: vi.fn(async (work: (tx: unknown) => Promise<unknown>) => {
      try {
        return await work(tx);
      } catch (error) {
        calls.rolledBack = true;
        throw error;
      }
    }),
  } as never;

  return { db, tx, calls };
};

describe("runInTransaction", () => {
  it("ok なら結果をそのまま返し、ロールバックしない", async () => {
    const { db, calls } = createDbStub();

    const result = await runInTransaction(
      db,
      () => ({ scope: "caps" }),
      async (caps) => ok(caps.scope),
    );

    expect(result).toStrictEqual(ok("caps"));
    expect(calls.rolledBack).toBe(false);
  });

  it("境界の中で組み立てた権能に executor としてトランザクションを渡す", async () => {
    const { db, tx } = createDbStub();
    const buildCaps = vi.fn((executor: unknown) => ({ executor }));

    await runInTransaction(db, buildCaps, async () => ok("done"));

    expect(buildCaps).toHaveBeenCalledWith(tx);
  });

  it("err ならロールバックしたうえで err を復元して返す", async () => {
    const { db, calls } = createDbStub();
    const failure = { type: "SomeBusinessError" };

    const result = await runInTransaction(
      db,
      () => ({}),
      async () => err(failure),
    );

    expect(result).toStrictEqual(err(failure));
    expect(calls.rolledBack).toBe(true);
  });

  it("業務エラー以外の例外はロールバックしてそのまま伝播する", async () => {
    const { db, calls } = createDbStub();
    const connectionError = new Error("connection terminated");

    await expect(
      runInTransaction(
        db,
        () => ({}),
        async () => {
          throw connectionError;
        },
      ),
    ).rejects.toBe(connectionError);
    expect(calls.rolledBack).toBe(true);
  });
});
