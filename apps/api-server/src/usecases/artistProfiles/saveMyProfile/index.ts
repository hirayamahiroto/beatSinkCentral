import type { IUserRepository } from "../../../domain/users/repositories";
import type { IArtistRepository } from "../../../domain/artists/repositories";
import type { IArtistProfileRepository } from "../../../domain/artistProfiles/repositories";
import type {
  ArtistProfile,
  ArtistProfileView,
} from "../../../domain/artistProfiles/entities";
import {
  createArtistProfile,
  reconstructArtistProfile,
  type ArtistProfileContent,
} from "../../../domain/artistProfiles/factories";
import {
  isPublished,
  publish,
  toPersistence,
  toView,
} from "../../../domain/artistProfiles/operations";
import {
  createUserNotFoundError,
  type UserNotFoundError,
} from "../../../domain/users/policies/assertRegistered";
import {
  createArtistNotFoundError,
  type ArtistNotFoundError,
} from "../../../domain/artists/policies/assertArtistExists";
import type { ProfileNotPublishableError } from "../../../domain/artistProfiles/policies/assertProfilePublishable";
import type { ITransactionRunner } from "../../../infrastructure/transaction";
import { type Result, ok, err } from "../../../utils/result";

export type SaveMyProfileInput = ArtistProfileContent & {
  subId: string;
};

export type SaveMyProfileOutput = {
  accountId: string;
  profile: ArtistProfileView;
};

export type SaveMyProfileError =
  | UserNotFoundError
  | ArtistNotFoundError
  | ProfileNotPublishableError;

export type SaveMyProfileDeps = {
  userRepository: IUserRepository;
  artistRepository: IArtistRepository;
  artistProfileRepository: IArtistProfileRepository;
  txRunner: ITransactionRunner;
};

export const saveMyProfileUseCase = async (
  input: SaveMyProfileInput,
  deps: SaveMyProfileDeps,
): Promise<Result<SaveMyProfileOutput, SaveMyProfileError>> => {
  const { subId, ...content } = input;

  return deps.txRunner.run(async (tx) => {
    const user = await deps.userRepository.findBySub(subId, tx);
    if (!user) return err(createUserNotFoundError());

    const artist = await deps.artistRepository.findByUserId(user.getId());
    if (!artist) return err(createArtistNotFoundError());

    const artistId = artist.getArtistId();
    const existing = await deps.artistProfileRepository.findByArtistId(
      artistId,
      tx,
    );

    const draft = existing
      ? reconstructArtistProfile({
          id: existing.id,
          artistId,
          published: false,
          ...content,
        })
      : createArtistProfile({ artistId, ...content });

    const profile: Result<ArtistProfile, ProfileNotPublishableError> =
      existing && isPublished(existing) ? publish(draft) : ok(draft);
    if (!profile.ok) return err(profile.error);

    const saved = await deps.artistProfileRepository.upsert(
      toPersistence(profile.value),
      tx,
    );

    return ok({
      accountId: artist.getAccountId(),
      profile: toView(saved),
    });
  });
};
