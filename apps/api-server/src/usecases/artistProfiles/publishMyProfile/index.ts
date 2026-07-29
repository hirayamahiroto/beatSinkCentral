import type { IUserRepository } from "../../../domain/users/repositories";
import type { IArtistRepository } from "../../../domain/artists/repositories";
import type { IArtistProfileRepository } from "../../../domain/artistProfiles/repositories";
import {
  createUserNotFoundError,
  type UserNotFoundError,
} from "../../../domain/users/policies/assertRegistered";
import {
  createArtistNotFoundError,
  type ArtistNotFoundError,
} from "../../../domain/artists/policies/assertArtistExists";
import {
  createArtistProfileNotFoundError,
  type ArtistProfileNotFoundError,
} from "../../../domain/artistProfiles/policies/assertArtistProfileExists";
import type { ProfileNotPublishableError } from "../../../domain/artistProfiles/policies/assertProfilePublishable";
import type { ArtistProfile } from "../../../domain/artistProfiles/entities";
import {
  isPublished,
  publish,
  unpublish,
} from "../../../domain/artistProfiles/operations";
import type { ITransactionRunner } from "../../../infrastructure/transaction";
import { ok, err, type Result } from "../../../utils/result";

export type PublishMyProfileInput = {
  subId: string;
  published: boolean;
};

export type PublishMyProfileOutput = {
  published: boolean;
};

export type PublishMyProfileError =
  | UserNotFoundError
  | ArtistNotFoundError
  | ArtistProfileNotFoundError
  | ProfileNotPublishableError;

export type PublishMyProfileDeps = {
  userRepository: IUserRepository;
  artistRepository: IArtistRepository;
  artistProfileRepository: IArtistProfileRepository;
  txRunner: ITransactionRunner;
};

export const publishMyProfileUseCase = async (
  input: PublishMyProfileInput,
  deps: PublishMyProfileDeps,
): Promise<Result<PublishMyProfileOutput, PublishMyProfileError>> =>
  deps.txRunner.run(async (tx) => {
    const user = await deps.userRepository.findBySub(input.subId, tx);
    if (!user) return err(createUserNotFoundError());

    const artist = await deps.artistRepository.findByUserId(user.getId());
    if (!artist) return err(createArtistNotFoundError());

    const profile = await deps.artistProfileRepository.findByArtistId(
      artist.getArtistId(),
      tx,
    );
    if (!profile) return err(createArtistProfileNotFoundError());

    const nextProfile: Result<ArtistProfile, ProfileNotPublishableError> =
      input.published ? publish(profile) : ok(unpublish(profile));
    if (!nextProfile.ok) return err(nextProfile.error);

    const saved = await deps.artistProfileRepository.setPublished(
      {
        artistId: artist.getArtistId(),
        published: isPublished(nextProfile.value),
      },
      tx,
    );

    return ok({ published: isPublished(saved) });
  });
