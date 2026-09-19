import type { DatabaseClient } from "../../../../../packages/database/src/utils/createClient";
import type { Result } from "../../utils/result";

type TransactionContext = Parameters<
  Parameters<DatabaseClient["transaction"]>[0]
>[0];

export type Executor = DatabaseClient | TransactionContext;

// Drizzle の transaction は throw でしかロールバックしないため、業務エラー（err）を
// 例外に載せて境界の外で復元する
class RollbackSignal<T, E> extends Error {
  constructor(readonly result: Result<T, E>) {
    super("rollback");
  }
}

export const runInTransaction = async <Caps, T, E>(
  db: DatabaseClient,
  buildCaps: (executor: Executor) => Caps,
  work: (caps: Caps) => Promise<Result<T, E>>,
): Promise<Result<T, E>> => {
  try {
    return await db.transaction(async (tx) => {
      const result = await work(buildCaps(tx));
      if (!result.ok) throw new RollbackSignal(result);
      return result;
    });
  } catch (error) {
    if (error instanceof RollbackSignal) return error.result;
    throw error;
  }
};
