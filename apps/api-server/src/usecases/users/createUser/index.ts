import {
  registerNewUser,
  type RegisterNewUserResult,
} from "../../../domain/services/userRegistration";
import { IUserRepository } from "../../../domain/users/repositories";
import { IArtistRepository } from "../../../domain/artists/repositories";
import type { ITransactionRunner } from "../../../infrastructure/transaction";

export type CreateUserInput = {
  subId: string;
  email: string;
  accountId: string;
};

export type CreateUserOutput = {
  userId: string;
  artistId: string;
};

export type CreateUserDeps = {
  userRepository: IUserRepository;
  artistRepository: IArtistRepository;
  txRunner: ITransactionRunner;
};

const registerUser = async (
  input: CreateUserInput,
  userRepository: IUserRepository,
  artistRepository: IArtistRepository,
): Promise<RegisterNewUserResult> => {
  const [userIfRegistered, artistIfAccountIdTaken] = await Promise.all([
    userRepository.findBySub(input.subId),
    artistRepository.findByAccountId(input.accountId),
  ]);
  return registerNewUser(input, userIfRegistered, artistIfAccountIdTaken);
};

const persistUserAggregate = async (
  { user, artist }: RegisterNewUserResult,
  deps: CreateUserDeps,
): Promise<CreateUserOutput> =>
  deps.txRunner.run(async (tx) => {
    await deps.userRepository.save(user.toPersistence(), tx);
    await deps.artistRepository.save(artist.toPersistence(), tx);
    return {
      userId: user.getId(),
      artistId: artist.getArtistId(),
    };
  });

export const createUserUseCase = async (
  input: CreateUserInput,
  deps: CreateUserDeps,
): Promise<CreateUserOutput> => {
  const aggregate = await registerUser(
    input,
    deps.userRepository,
    deps.artistRepository,
  );
  return persistUserAggregate(aggregate, deps);
};
