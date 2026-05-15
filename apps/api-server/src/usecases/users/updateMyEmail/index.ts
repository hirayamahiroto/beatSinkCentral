import type { IUserRepository } from "../../../domain/users/repositories";
import { assertRegistered } from "../../../domain/users/policies/assertRegistered";
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
): Promise<UpdateMyEmailOutput> =>
  deps.txRunner.run(async (tx) => {
    const user = await deps.userRepository.findBySub(input.subId, tx);
    assertRegistered(user);

    const updated = user.changeEmail(input.email);
    const saved = await deps.userRepository.updateEmail(
      { id: updated.getId(), email: updated.getEmail() },
      tx,
    );

    return {
      userId: saved.getId(),
      email: saved.getEmail(),
    };
  });
