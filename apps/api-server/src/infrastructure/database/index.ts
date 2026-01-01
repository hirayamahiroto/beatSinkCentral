import { createDatabaseClient } from "../../../../../packages/database/src/utils/createClient";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not defined");
}

export const db = createDatabaseClient(databaseUrl);
