import { v4 as uuidv4 } from "uuid";
import { User } from "../../entities/user";

type CreateUserDto = {
  email: string;
  username: string;
  attributes?: Record<string, unknown>;
};

export class UserFactory {
  public static create(dto: CreateUserDto): User {
    const now = new Date();
    return new User(
      uuidv4(),
      dto.email,
      dto.username,
      dto.attributes || {},
      now,
      now
    );
  }

  public static reconstitute(data: {
    id: string;
    email: string;
    username: string;
    attributes: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    return new User(
      data.id,
      data.email,
      data.username,
      data.attributes,
      data.createdAt,
      data.updatedAt
    );
  }
}
