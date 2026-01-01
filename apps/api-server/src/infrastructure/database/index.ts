import { createDatabaseClient } from "database";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not defined");
}

export const db = createDatabaseClient(databaseUrl);
