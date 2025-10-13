import { CreateUserDto } from "../../repositories/IUserRepository";
import { v4 as uuidv4 } from "uuid";
import { User } from "../../entities/user";

export class UserFactory {
  public static create(dto: CreateUserDto): User {
    const now = new Date();
    return new User(
      uuidv4(),
      dto.auth0UserId,
      dto.email,
      dto.username,
      dto.attributes || {},
      now,
      now
    );
  }

  public static reconstitute(data: {
    id: string;
    auth0UserId: string;
    email: string;
    username: string;
    attributes: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    return new User(
      data.id,
      data.auth0UserId,
      data.email,
      data.username,
      data.attributes,
      data.createdAt,
      data.updatedAt
    );
  }
}
