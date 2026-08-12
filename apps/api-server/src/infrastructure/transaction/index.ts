import type { DatabaseClient } from "../../../../../packages/database/src/utils/createClient";

export type TransactionContext = Parameters<
  Parameters<DatabaseClient["transaction"]>[0]
>[0];
