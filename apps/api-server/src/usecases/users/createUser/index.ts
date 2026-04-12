import { createUser } from "../../../domain/users/factories";
import { IUserRepository } from "../../../domain/users/repositories";
import { createUserAlreadyRegisteredError } from "./errors";

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
  const existingUser = await userRepository.findBySub(input.subId);
  if (existingUser) {
    throw createUserAlreadyRegisteredError(input.subId);
  }

  const user = createUser({
    subId: input.subId,
    email: input.email,
  });

  const savedUser = await userRepository.save(user.toPersistence());

  return { userId: savedUser.getId() };
};
