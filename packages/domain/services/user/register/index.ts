import { User } from "../../../entities/user";
import { UserFactory } from "../../../factory/UserFactory";
import { RoleFactory } from "../../../factory/RoleFactory";

export type RegisterRequest = {
  email: string;
  password: string;
};

export type RegisterResponse = {
  user: User;
};

export const register = async (
  request: RegisterRequest
): Promise<RegisterResponse> => {
  const user = UserFactory.register({
    email: request.email,
    password: request.password,
    role: RoleFactory.createAudience(),
  });

  return {
    user,
  };
};
