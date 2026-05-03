import type { DatabaseClient } from "../../../../../packages/database/src/utils/createClient";

export type TransactionContext = Parameters<
  Parameters<DatabaseClient["transaction"]>[0]
>[0];

export interface ITransactionRunner {
  run<T>(fn: (tx: TransactionContext) => Promise<T>): Promise<T>;
}

export const createTransactionRunner = (
  db: DatabaseClient,
): ITransactionRunner => ({
  async run<T>(fn: (tx: TransactionContext) => Promise<T>): Promise<T> {
    return db.transaction(fn);
  },
});
