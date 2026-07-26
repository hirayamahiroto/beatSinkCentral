import type { IUserRepository } from "../../../domain/users/repositories";
import {
  createUserNotFoundError,
  type UserNotFoundError,
} from "../../../domain/users/policies/assertRegistered";
import {
  createEmail,
  type InvalidEmailFormatError,
} from "../../../domain/users/valueObjects/email";
import type { ITransactionRunner } from "../../../infrastructure/transaction";
import { type Result, ok, err } from "../../../utils/result";

export type UpdateMyEmailInput = {
  subId: string;
  email: string;
};

export type UpdateMyEmailOutput = {
  userId: string;
  email: string;
};

export type UpdateMyEmailError = InvalidEmailFormatError | UserNotFoundError;

export type UpdateMyEmailDeps = {
  userRepository: IUserRepository;
  txRunner: ITransactionRunner;
};

export const updateMyEmailUseCase = async (
  input: UpdateMyEmailInput,
  deps: UpdateMyEmailDeps,
): Promise<Result<UpdateMyEmailOutput, UpdateMyEmailError>> => {
  const newEmail = createEmail(input.email);
  if (!newEmail.ok) {
    return err(newEmail.error);
  }

  return deps.txRunner.run(async (tx) => {
    const user = await deps.userRepository.findBySub(input.subId, tx);
    if (!user) {
      return err(createUserNotFoundError());
    }

    const updated = user.changeEmail(newEmail.value);
    const saved = await deps.userRepository.updateEmail(
      { id: updated.getId(), email: updated.getEmail() },
      tx,
    );

    return ok({
      userId: saved.getId(),
      email: saved.getEmail(),
    });
  });
};
