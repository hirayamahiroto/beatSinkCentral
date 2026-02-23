import postgres from "postgres";
import * as fs from "fs";
import * as path from "path";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const sql = postgres(DATABASE_URL);

const seedFile = path.resolve(
  import.meta.dirname,
  "../supabase/seed.sql"
);
const seedSql = fs.readFileSync(seedFile, "utf-8");

await sql.unsafe(seedSql);
console.log("Seed completed successfully");
await sql.end();
