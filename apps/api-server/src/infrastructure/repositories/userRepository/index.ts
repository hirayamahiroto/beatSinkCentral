import { eq } from "drizzle-orm";
import { usersTable } from "../../../../../../packages/database/src/utils/createClient";
import { User } from "../../../domain/users/entities";
import {
  IUserReader,
  IUserWriter,
  UserSaveData,
  UserUpdateEmailData,
} from "../../../domain/users/repositories";
import { reconstructUser } from "../../../domain/users/factories";
import type { Executor } from "../../transaction";

const userColumns = {
  id: usersTable.id,
  subId: usersTable.subId,
  email: usersTable.email,
};

export const createUserReader = (executor: Executor): IUserReader => ({
  async findBySub(sub: string): Promise<User | null> {
    const results = await executor
      .select(userColumns)
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

export const createUserWriter = (executor: Executor): IUserWriter => ({
  async save(data: UserSaveData): Promise<User> {
    const [result] = await executor
      .insert(usersTable)
      .values(data)
      .returning(userColumns);

    return reconstructUser({
      id: result.id,
      subId: result.subId,
      email: result.email,
    });
  },

  async updateEmail(data: UserUpdateEmailData): Promise<User> {
    const [result] = await executor
      .update(usersTable)
      .set({ email: data.email })
      .where(eq(usersTable.id, data.id))
      .returning(userColumns);

    return reconstructUser({
      id: result.id,
      subId: result.subId,
      email: result.email,
    });
  },
});
