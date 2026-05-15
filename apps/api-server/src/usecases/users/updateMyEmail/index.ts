import type { IUserRepository } from "../../../domain/users/repositories";
import { assertRegistered } from "../../../domain/users/policies/assertRegistered";
import { createEmail } from "../../../domain/users/valueObjects/email";
import type { ITransactionRunner } from "../../../infrastructure/transaction";

export type UpdateMyEmailInput = {
  subId: string;
  email: string;
};

export type UpdateMyEmailOutput = {
  userId: string;
  email: string;
};

export type UpdateMyEmailDeps = {
  userRepository: IUserRepository;
  txRunner: ITransactionRunner;
};

export const updateMyEmailUseCase = async (
  input: UpdateMyEmailInput,
  deps: UpdateMyEmailDeps,
): Promise<UpdateMyEmailOutput> => {
  const newEmail = createEmail(input.email);

  return deps.txRunner.run(async (tx) => {
    const user = await deps.userRepository.findBySub(input.subId, tx);
    assertRegistered(user);

    const updated = user.changeEmail(newEmail);
    const saved = await deps.userRepository.updateEmail(
      { id: updated.getId(), email: updated.getEmail() },
      tx,
    );

    return {
      userId: saved.getId(),
      email: saved.getEmail(),
    };
  });
};
