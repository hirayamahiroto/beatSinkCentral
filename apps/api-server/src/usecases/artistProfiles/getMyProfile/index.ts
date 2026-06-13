import type { IUserRepository } from "../../../domain/users/repositories";
import type { IArtistRepository } from "../../../domain/artists/repositories";
import type { IArtistProfileRepository } from "../../../domain/artistProfiles/repositories";
import type { ArtistProfileView } from "../../../domain/artistProfiles/entities";
import { assertRegistered } from "../../../domain/users/policies/assertRegistered";
import { assertArtistExists } from "../../../domain/artists/policies/assertArtistExists";

export type GetMyProfileInput = {
  subId: string;
};

export type GetMyProfileOutput = {
  accountId: string;
  // 未作成（下書きすら無い）なら null。編集フォームの初期表示に使う。
  profile: ArtistProfileView | null;
};

export type GetMyProfileDeps = {
  userRepository: IUserRepository;
  artistRepository: IArtistRepository;
  artistProfileRepository: IArtistProfileRepository;
};

// 本人の編集用にプロフィールを取得する（下書きを含む全フィールド）。
export const getMyProfileUseCase = async (
  input: GetMyProfileInput,
  deps: GetMyProfileDeps,
): Promise<GetMyProfileOutput> => {
  const user = await deps.userRepository.findBySub(input.subId);
  assertRegistered(user);

  const artist = await deps.artistRepository.findByUserId(user.getId());
  assertArtistExists(artist);

  const profile = await deps.artistProfileRepository.findByArtistId(
    artist.getArtistId(),
  );

  return {
    accountId: artist.getAccountId(),
    profile: profile ? profile.toView() : null,
  };
};
