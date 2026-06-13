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
  profile: ArtistProfileView | null;
};

export type GetMyProfileDeps = {
  userRepository: IUserRepository;
  artistRepository: IArtistRepository;
  artistProfileRepository: IArtistProfileRepository;
};

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
