import type { IUserRepository } from "../../../domain/users/repositories";
import type { IArtistRepository } from "../../../domain/artists/repositories";
import { assertRegistered } from "../../../domain/users/policies/assertRegistered";
import { assertArtistExists } from "../../../domain/artists/policies/assertArtistExists";
import { assertAccountIdAvailable } from "../../../domain/artists/policies/assertAccountIdAvailable";
import { createAccountId } from "../../../domain/artists/valueObjects/accountId";
import type { ITransactionRunner } from "../../../infrastructure/transaction";

export type UpdateMyAccountIdInput = {
  subId: string;
  accountId: string;
};

export type UpdateMyAccountIdOutput = {
  artistId: string;
  accountId: string;
};

export type UpdateMyAccountIdDeps = {
  userRepository: IUserRepository;
  artistRepository: IArtistRepository;
  txRunner: ITransactionRunner;
};

export const updateMyAccountIdUseCase = async (
  input: UpdateMyAccountIdInput,
  deps: UpdateMyAccountIdDeps,
): Promise<UpdateMyAccountIdOutput> => {
  const newAccountId = createAccountId(input.accountId);

  return deps.txRunner.run(async (tx) => {
    const user = await deps.userRepository.findBySub(input.subId, tx);
    assertRegistered(user);

    const artist = await deps.artistRepository.findByUserId(user.getId());
    assertArtistExists(artist);

    if (artist.hasAccountId(newAccountId)) {
      return {
        artistId: artist.getArtistId(),
        accountId: artist.getAccountId(),
      };
    }

    const taken = await deps.artistRepository.findByAccountId(
      newAccountId.value,
      tx,
    );
    assertAccountIdAvailable(taken);

    const updated = artist.changeAccountId(newAccountId);
    const saved = await deps.artistRepository.updateAccountId(
      { artistId: updated.getArtistId(), accountId: updated.getAccountId() },
      tx,
    );

    return {
      artistId: saved.getArtistId(),
      accountId: saved.getAccountId(),
    };
  });
};
