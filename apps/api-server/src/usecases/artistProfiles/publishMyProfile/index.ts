import type { IUserRepository } from "../../../domain/users/repositories";
import type { IArtistRepository } from "../../../domain/artists/repositories";
import type { IArtistProfileRepository } from "../../../domain/artistProfiles/repositories";
import { assertRegistered } from "../../../domain/users/policies/assertRegistered";
import { assertArtistExists } from "../../../domain/artists/policies/assertArtistExists";
import { assertArtistProfileExists } from "../../../domain/artistProfiles/policies/assertArtistProfileExists";
import { assertProfilePublishable } from "../../../domain/artistProfiles/policies/assertProfilePublishable";
import type { ITransactionRunner } from "../../../infrastructure/transaction";

export type PublishMyProfileInput = {
  subId: string;
  published: boolean;
};

export type PublishMyProfileOutput = {
  published: boolean;
};

export type PublishMyProfileDeps = {
  userRepository: IUserRepository;
  artistRepository: IArtistRepository;
  artistProfileRepository: IArtistProfileRepository;
  txRunner: ITransactionRunner;
};

// プロフィールの公開 / 非公開を切り替える。
// 公開時のみ最小核（publish ゲート）を検証する。非公開化は常に可能。
export const publishMyProfileUseCase = async (
  input: PublishMyProfileInput,
  deps: PublishMyProfileDeps,
): Promise<PublishMyProfileOutput> => {
  return deps.txRunner.run(async (tx) => {
    const user = await deps.userRepository.findBySub(input.subId, tx);
    assertRegistered(user);

    const artist = await deps.artistRepository.findByUserId(user.getId());
    assertArtistExists(artist);

    const profile = await deps.artistProfileRepository.findByArtistId(
      artist.getArtistId(),
      tx,
    );
    assertArtistProfileExists(profile);

    if (input.published) {
      assertProfilePublishable(profile);
    }

    const saved = await deps.artistProfileRepository.setPublished(
      { artistId: artist.getArtistId(), published: input.published },
      tx,
    );

    return { published: saved.isPublished() };
  });
};
