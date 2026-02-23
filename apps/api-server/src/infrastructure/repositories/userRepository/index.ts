import { eq } from "drizzle-orm";
import {
  DatabaseClient,
  usersTable,
} from "../../../../../../packages/database/src/utils/createClient";
import { User } from "../../../domain/users/entities";
import { IUserRepository } from "../../../domain/users/repositories";

export const createUserRepository = (db: DatabaseClient): IUserRepository => ({
  async save(user: User): Promise<string> {
    const [result] = await db
      .insert(usersTable)
      .values(user.toJSON())
      .returning({ id: usersTable.id });

    return result.id;
  },

  async findUserIdBySub(sub: string): Promise<string | null> {
    const results = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.subId, sub))
      .limit(1);

    if (results.length === 0) {
      return null;
    }

    return results[0].id;
  },
});
