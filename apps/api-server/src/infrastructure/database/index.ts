import { createDatabaseClient } from "../../../../../packages/database/src/utils/createClient";

const databaseUrl = process.env.DATABASE_URL!;

export const db = createDatabaseClient(databaseUrl);
