import { User } from "../../../entities/user";
import { Role } from "../../../entities/Role";
import { UserFactory } from "../../../factory/UserFactory";

export type RegisterRequest = {
  email: string;
  password: string;
};

export type RegisterResponse = {
  user: User;
};

export async function register(
  request: RegisterRequest
): Promise<RegisterResponse> {
  const user = UserFactory.register({
    email: request.email,
    password: request.password,
    role: new Role("audience"),
  });

  return {
    user,
  };
}
