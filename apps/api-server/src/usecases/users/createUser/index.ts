import {
  registerNewUser,
  type RegisterNewUserError,
} from "../../../domain/services/userRegistration";
import { IUserRepository } from "../../../domain/users/repositories";
import { IArtistRepository } from "../../../domain/artists/repositories";
import type { ITransactionRunner } from "../../../infrastructure/transaction";
import { type Result, ok } from "../../../utils/result";

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
): Promise<Result<CreateUserOutput, CreateUserError>> =>
  deps.txRunner.run(async (tx) => {
    const [userIfRegistered, artistIfAccountIdTaken] = await Promise.all([
      deps.userRepository.findBySub(input.subId, tx),
      deps.artistRepository.findByAccountId(input.accountId, tx),
    ]);

    const built = registerNewUser(
      input,
      userIfRegistered,
      artistIfAccountIdTaken,
    );
    if (!built.ok) {
      return built;
    }

    const { user, artist } = built.value;
    await deps.userRepository.save(user.toPersistence(), tx);
    await deps.artistRepository.save(artist.toPersistence(), tx);

    return ok({
      userId: user.getId(),
      artistId: artist.getArtistId(),
    });
  });
