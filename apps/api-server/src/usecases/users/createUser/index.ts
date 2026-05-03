import { registerNewUser } from "../../../domain/services/userRegistration";
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

export const createUserUseCase = async (
  input: CreateUserInput,
  deps: CreateUserDeps,
): Promise<CreateUserOutput> =>
  deps.txRunner.run(async (tx) => {
    const [userIfRegistered, artistIfAccountIdTaken] = await Promise.all([
      deps.userRepository.findBySub(input.subId, tx),
      deps.artistRepository.findByAccountId(input.accountId, tx),
    ]);
    const { user, artist } = registerNewUser(
      input,
      userIfRegistered,
      artistIfAccountIdTaken,
    );
    await deps.userRepository.save(user.toPersistence(), tx);
    await deps.artistRepository.save(artist.toPersistence(), tx);
    return {
      userId: user.getId(),
      artistId: artist.getArtistId(),
    };
  });
