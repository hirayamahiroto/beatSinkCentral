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
import { assertRegistered } from "../../../domain/users/policies/assertRegistered";
import { assertArtistExists } from "../../../domain/artists/policies/assertArtistExists";
import type { ITransactionRunner } from "../../../infrastructure/transaction";

export type SaveMyProfileInput = ArtistProfileContent & {
  subId: string;
};

export type SaveMyProfileOutput = {
  accountId: string;
  profile: ArtistProfileView;
};

export type SaveMyProfileDeps = {
  userRepository: IUserRepository;
  artistRepository: IArtistRepository;
  artistProfileRepository: IArtistProfileRepository;
  txRunner: ITransactionRunner;
};

export const saveMyProfileUseCase = async (
  input: SaveMyProfileInput,
  deps: SaveMyProfileDeps,
): Promise<SaveMyProfileOutput> => {
  const { subId, ...content } = input;

  return deps.txRunner.run(async (tx) => {
    const user = await deps.userRepository.findBySub(subId, tx);
    assertRegistered(user);

    const artist = await deps.artistRepository.findByUserId(user.getId());
    assertArtistExists(artist);

    const artistId = artist.getArtistId();
    const existing = await deps.artistProfileRepository.findByArtistId(
      artistId,
      tx,
    );

    const profile: ArtistProfile = existing
      ? reconstructArtistProfile({
          id: existing.getId(),
          artistId,
          published: existing.isPublished(),
          ...content,
        })
      : createArtistProfile({ artistId, ...content });

    const saved = await deps.artistProfileRepository.upsert(
      profile.toPersistence(),
      tx,
    );

    return {
      accountId: artist.getAccountId(),
      profile: saved.toView(),
    };
  });
};
