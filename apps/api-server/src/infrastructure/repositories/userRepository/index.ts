import { eq } from "drizzle-orm";
import { DatabaseClient, usersTable } from "database";
import { createUser, User } from "../../../domain/users/entities";
import {
  CreateUserParams,
  IUserRepository,
} from "../../../domain/users/repositories";

const toEntity = (record: typeof usersTable.$inferSelect): User => {
  return createUser({
    accountId: record.accountId,
    sub: record.sub,
    email: record.email,
    name: record.name,
  });
};

export const createUserRepository = (db: DatabaseClient): IUserRepository => ({
  async create(params: CreateUserParams): Promise<User> {
    const [result] = await db
      .insert(usersTable)
      .values({
        accountId: params.accountId,
        sub: params.sub,
        email: params.email,
        name: params.name,
      })
      .returning();

    return toEntity(result);
  },

  async findBySub(sub: string): Promise<User | null> {
    const results = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.sub, sub))
      .limit(1);

    if (results.length === 0) {
      return null;
    }

    return toEntity(results[0]);
  },
});
