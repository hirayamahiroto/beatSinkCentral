import { eq } from "drizzle-orm";
import {
  DatabaseClient,
  usersTable,
} from "../../../../../../packages/database/src/utils/createClient";
import { User } from "../../../domain/users/entities";
import {
  IUserRepository,
  UserSaveData,
} from "../../../domain/users/repositories";
import { reconstructUser } from "../../../domain/users/factories";
import type { TransactionContext } from "../../transaction";

export const createUserRepository = (db: DatabaseClient): IUserRepository => ({
  async save(data: UserSaveData, tx?: TransactionContext): Promise<User> {
    const executor = tx ?? db;
    const [result] = await executor.insert(usersTable).values(data).returning({
      id: usersTable.id,
      subId: usersTable.subId,
      email: usersTable.email,
    });

    return reconstructUser({
      id: result.id,
      subId: result.subId,
      email: result.email,
    });
  },

  async findBySub(sub: string, tx?: TransactionContext): Promise<User | null> {
    const executor = tx ?? db;
    const results = await executor
      .select({
        id: usersTable.id,
        subId: usersTable.subId,
        email: usersTable.email,
      })
      .from(usersTable)
      .where(eq(usersTable.subId, sub))
      .limit(1);

    if (results.length === 0) {
      return null;
    }

    const row = results[0];
    return reconstructUser({
      id: row.id,
      subId: row.subId,
      email: row.email,
    });
  },
});
