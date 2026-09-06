import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

export type DatabaseClient = ReturnType<typeof createDatabaseClient>;

export function createDatabaseClient(databaseUrl: string) {
  const client = postgres(databaseUrl);
  return drizzle(client);
}

export * from "../../schema";
