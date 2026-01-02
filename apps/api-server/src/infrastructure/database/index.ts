import {
  createDatabaseClient,
  DatabaseClient,
} from "../../../../../packages/database/src/utils/createClient";

let _db: DatabaseClient | null = null;

export function getDb(): DatabaseClient {
  if (!_db) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL is not defined");
    }
    _db = createDatabaseClient(databaseUrl);
  }
  return _db;
}
