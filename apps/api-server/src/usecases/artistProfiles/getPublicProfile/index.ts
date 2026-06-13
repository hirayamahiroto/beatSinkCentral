import type { IArtistProfileRepository } from "../../../domain/artistProfiles/repositories";
import type { ArtistProfileView } from "../../../domain/artistProfiles/entities";
import { assertArtistProfileExists } from "../../../domain/artistProfiles/policies/assertArtistProfileExists";

export type GetPublicProfileInput = {
  accountId: string;
};

export type GetPublicProfileOutput = {
  accountId: string;
  profile: ArtistProfileView;
};

export type GetPublicProfileDeps = {
  artistProfileRepository: IArtistProfileRepository;
};

// 公開詳細ページ用。accountId（ハンドル）で引き、published のもののみ返す。
// 非公開・未作成・存在しない accountId はすべて ArtistProfileNotFoundError（404）。
export const getPublicProfileUseCase = async (
  input: GetPublicProfileInput,
  deps: GetPublicProfileDeps,
): Promise<GetPublicProfileOutput> => {
  const profile =
    await deps.artistProfileRepository.findPublishedByAccountId(
      input.accountId,
    );
  assertArtistProfileExists(profile);

  return {
    accountId: input.accountId,
    profile: profile.toView(),
  };
};
