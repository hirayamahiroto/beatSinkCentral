import { v4 as uuidv4 } from "uuid";
import { User } from "../../entities/user";
import { Role } from "../../entities/Role";

type CreateUserDto = {
  email: string;
  password: string;
  role: Role;
};
export class UserFactory {
  public static register(dto: CreateUserDto): User {
    return new User(uuidv4(), dto.email, dto.password, dto.role);
  }
}
