import { eq } from "drizzle-orm";
import { Database, usersTable } from "database";
import { User } from "../../domain/users/entities";
import { IUserRepository } from "../../domain/users/repositories";
import { CreateUserDto } from "../../domain/users/dataTransferObjects";

export class UserRepository implements IUserRepository {
  constructor(private readonly db: Database) {}

  async create(dto: CreateUserDto): Promise<User> {
    const [result] = await this.db
      .insert(usersTable)
      .values({
        auth0UserId: dto.auth0UserId,
        email: dto.email,
        username: dto.username,
        attributes: dto.attributes || {},
      })
      .returning();

    return this.toEntity(result);
  }

  async findByAuth0UserId(auth0UserId: string): Promise<User | null> {
    const results = await this.db
      .select()
      .from(usersTable)
      .where(eq(usersTable.auth0UserId, auth0UserId))
      .limit(1);

    if (results.length === 0) {
      return null;
    }

    return this.toEntity(results[0]);
  }

  private toEntity(record: typeof usersTable.$inferSelect): User {
    return User.reconstitute({
      id: record.id,
      auth0UserId: record.auth0UserId,
      email: record.email,
      username: record.username,
      attributes: (record.attributes as Record<string, unknown>) || {},
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
