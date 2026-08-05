import type { IUserRepository } from "../../../domain/users/repositories";
import type { IArtistRepository } from "../../../domain/artists/repositories";
import {
  createUserNotFoundError,
  type UserNotFoundError,
} from "../../../domain/users/errors/userNotFound";
import {
  createArtistNotFoundError,
  type ArtistNotFoundError,
} from "../../../domain/artists/errors/artistNotFound";
import {
  createAccountIdAlreadyTakenError,
  type AccountIdAlreadyTakenError,
} from "../../../domain/artists/errors/accountIdAlreadyTaken";
import {
  createAccountId,
  type InvalidAccountIdFormatError,
} from "../../../domain/artists/valueObjects/accountId";
import type { ITransactionRunner } from "../../../infrastructure/transaction";
import { type Result, ok, err } from "../../../utils/result";

export type UpdateMyAccountIdInput = {
  subId: string;
  accountId: string;
};

export type UpdateMyAccountIdOutput = {
  artistId: string;
  accountId: string;
};

export type UpdateMyAccountIdError =
  | InvalidAccountIdFormatError
  | UserNotFoundError
  | ArtistNotFoundError
  | AccountIdAlreadyTakenError;

export type UpdateMyAccountIdDeps = {
  userRepository: IUserRepository;
  artistRepository: IArtistRepository;
  txRunner: ITransactionRunner;
};

export const updateMyAccountIdUseCase = async (
  input: UpdateMyAccountIdInput,
  deps: UpdateMyAccountIdDeps,
): Promise<Result<UpdateMyAccountIdOutput, UpdateMyAccountIdError>> => {
  const parsed = createAccountId(input.accountId);
  if (!parsed.ok) return parsed;
  const newAccountId = parsed.value;

  return deps.txRunner.run(
    async (
      tx,
    ): Promise<Result<UpdateMyAccountIdOutput, UpdateMyAccountIdError>> => {
      const user = await deps.userRepository.findBySub(input.subId, tx);
      if (!user) return err(createUserNotFoundError());

      const artist = await deps.artistRepository.findByUserId(user.getId());
      if (!artist) return err(createArtistNotFoundError());

      if (artist.hasAccountId(newAccountId)) {
        return ok({
          artistId: artist.getArtistId(),
          accountId: artist.getAccountId(),
        });
      }

      const taken = await deps.artistRepository.findByAccountId(
        newAccountId.value,
        tx,
      );
      if (taken) {
        return err(createAccountIdAlreadyTakenError(taken.getAccountId()));
      }

      const updated = artist.changeAccountId(newAccountId);
      const saved = await deps.artistRepository.updateAccountId(
        { artistId: updated.getArtistId(), accountId: updated.getAccountId() },
        tx,
      );

      return ok({
        artistId: saved.getArtistId(),
        accountId: saved.getAccountId(),
      });
    },
  );
};
