import { registerNewUser } from "../../../domain/services/userRegistration";
import { IUserRepository } from "../../../domain/users/repositories";
import { IArtistRepository } from "../../../domain/artists/repositories";
import { IArtistOwnerRepository } from "../../../domain/artistOwners/repositories";
import type { ITransactionRunner } from "../../../infrastructure/transaction";
import { createUserAlreadyRegisteredError } from "./errors";

type CreateUserInput = {
  subId: string;
  email: string;
  accountId: string;
};

type CreateUserOutput = {
  userId: string;
  artistId: string;
};

type CreateUserDeps = {
  userRepository: IUserRepository;
  artistRepository: IArtistRepository;
  artistOwnerRepository: IArtistOwnerRepository;
  txRunner: ITransactionRunner;
};

export const createUserUseCase = async (
  input: CreateUserInput,
  deps: CreateUserDeps
): Promise<CreateUserOutput> => {
  const existingUser = await deps.userRepository.findBySub(input.subId);
  if (existingUser) {
    throw createUserAlreadyRegisteredError(input.subId);
  }

  const { user, artist, owner } = registerNewUser(input);

  return await deps.txRunner.run(async (tx) => {
    await deps.userRepository.save(user.toPersistence(), tx);
    await deps.artistRepository.save(artist.toPersistence(), tx);
    await deps.artistOwnerRepository.save(owner.toPersistence(), tx);

    return {
      userId: user.getId(),
      artistId: artist.getArtistId(),
    };
  });
};
