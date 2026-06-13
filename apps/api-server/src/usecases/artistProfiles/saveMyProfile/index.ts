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

// 本人のプロフィールを作成 / 更新する（upsert）。
// 最小核が欠けていても保存は許可（下書き）。公開可否は publish 側で判定する。
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

    // 既存があれば ID と公開状態を保持し、内容のみ差し替える。
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
