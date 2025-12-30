import { eq } from "drizzle-orm";
import { Database, usersTable } from "database";
import { createUser, User } from "../../../domain/users/entities";
import {
  CreateUserParams,
  IUserRepository,
} from "../../../domain/users/repositories";

const toEntity = (record: typeof usersTable.$inferSelect): User => {
  return createUser({
    auth0UserId: record.auth0UserId,
    email: record.email,
    username: record.username,
    attributes: (record.attributes as Record<string, unknown>) || {},
  });
};

export const createUserRepository = (db: Database): IUserRepository => ({
  async create(params: CreateUserParams): Promise<User> {
    const [result] = await db
      .insert(usersTable)
      .values({
        auth0UserId: params.auth0UserId,
        email: params.email,
        username: params.username,
        attributes: params.attributes || {},
      })
      .returning();

    return toEntity(result);
  },

  async findByAuth0UserId(auth0UserId: string): Promise<User | null> {
    const results = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.auth0UserId, auth0UserId))
      .limit(1);

    if (results.length === 0) {
      return null;
    }

    return toEntity(results[0]);
  },
});
