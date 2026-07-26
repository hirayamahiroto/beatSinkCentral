import { type Result } from "../../../shared/result";
import { defineUsecase } from "../../../shared/defineUsecase";
import type { RegisteredUser } from "../../user";
import type { UserRepositoryPort } from "../../repository";
import {
  registerUser,
  type RegisterUserInput,
  type RegisterUserError,
} from "../../workflow/registerUser";

export type RegisterUserUsecaseDeps = {
  userRepository: UserRepositoryPort;
  newId: () => string;
};

export const registerUserUsecase = defineUsecase<
  RegisterUserUsecaseDeps,
  RegisterUserInput,
  Result<RegisteredUser, RegisterUserError>
>((deps) => async (input) => {
  const existing = await deps.userRepository.findRegisteredBySub(input.sub);

  const result = registerUser(input, existing, deps.newId());
  if (result.ok) {
    await deps.userRepository.save(result.value);
  }

  return result;
});
