import { createUser } from "../../domain/users/factories";
import { IUserRepository } from "../../domain/users/repositories";

type CreateUserInput = {
  accountId: string;
  sub: string;
  email: string;
  name: string;
};

type CreateUserOutput = {
  userId: string;
};

export const createUserUseCase = async (
  input: CreateUserInput,
  userRepository: IUserRepository
): Promise<CreateUserOutput> => {
  const existingUserId = await userRepository.findUserIdBySub(input.sub);
  if (existingUserId) {
    return { userId: existingUserId };
  }

  const user = createUser({
    accountId: input.accountId,
    sub: input.sub,
    email: input.email,
    name: input.name,
  });

  const userId = await userRepository.save(user);

  return { userId };
};
