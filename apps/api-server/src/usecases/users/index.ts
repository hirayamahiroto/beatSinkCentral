import { createUser } from "../../domain/users/factories";
import { IUserRepository } from "../../domain/users/repositories";

type CreateUserInput = {
  subId: string;
  email: string;
};

type CreateUserOutput = {
  userId: string;
};

export const createUserUseCase = async (
  input: CreateUserInput,
  userRepository: IUserRepository
): Promise<CreateUserOutput> => {
  const existingUserId = await userRepository.findUserIdBySub(input.subId);
  if (existingUserId) {
    return { userId: existingUserId };
  }

  const user = createUser({
    subId: input.subId,
    email: input.email,
  });

  const userId = await userRepository.save(user);

  return { userId };
};
