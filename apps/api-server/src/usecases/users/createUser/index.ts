import {
  registerNewUser,
  type RegisterNewUserError,
} from "../../../domain/services/userRegistration";
import { IUserRepository } from "../../../domain/users/repositories";
import { IArtistRepository } from "../../../domain/artists/repositories";
import { isAccountIdAlreadyTakenError } from "../../../domain/artists/errors/accountIdAlreadyTaken";
import type { ITransactionRunner } from "../../../infrastructure/transaction";
import { type Result, ok, err } from "../../../utils/result";

export type CreateUserInput = {
  subId: string;
  email: string;
  accountId: string;
};

export type CreateUserOutput = {
  userId: string;
  artistId: string;
};

export type CreateUserError = RegisterNewUserError;

export type CreateUserDeps = {
  userRepository: IUserRepository;
  artistRepository: IArtistRepository;
  txRunner: ITransactionRunner;
};

export const createUserUseCase = async (
  input: CreateUserInput,
  deps: CreateUserDeps,
): Promise<Result<CreateUserOutput, CreateUserError>> => {
  try {
    return await deps.txRunner.run(async (tx) => {
      const [userIfRegistered, artistIfAccountIdTaken] = await Promise.all([
        deps.userRepository.findBySub(input.subId, tx),
        deps.artistRepository.findByAccountId(input.accountId, tx),
      ]);

      const registered = registerNewUser(
        input,
        userIfRegistered,
        artistIfAccountIdTaken,
      );
      if (!registered.ok) return registered;

      const { user, artist } = registered.value;
      await deps.userRepository.save(user.toPersistence(), tx);
      await deps.artistRepository.save(artist.toPersistence(), tx);

      return ok({
        userId: user.getId(),
        artistId: artist.getArtistId(),
      });
    });
  } catch (error) {
    if (isAccountIdAlreadyTakenError(error)) return err(error);
    throw error;
  }
};
