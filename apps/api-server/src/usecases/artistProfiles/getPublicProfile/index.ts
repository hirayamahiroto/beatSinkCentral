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
