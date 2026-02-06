import {
  createDatabaseClient,
  DatabaseClient,
} from "../../../../../packages/database/src/utils/createClient";

export const getDb = (() => {
  let db: DatabaseClient | null = null;

  return (): DatabaseClient => {
    if (!db) {
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new Error("DATABASE_URL is not defined");
      }
      db = createDatabaseClient(databaseUrl);
    }
    return db;
  };
})();
