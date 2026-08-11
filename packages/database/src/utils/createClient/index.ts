import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../schema/index.js";

export type DatabaseClient = ReturnType<typeof createDatabaseClient>;

export function createDatabaseClient(databaseUrl: string) {
  const client = postgres(databaseUrl);
  return drizzle(client, { schema });
}

export * from "../../schema/index.js";
