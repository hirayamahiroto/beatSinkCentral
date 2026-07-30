import type { IUserRepository } from "../../../domain/users/repositories";
import type { IArtistRepository } from "../../../domain/artists/repositories";
import type { IArtistProfileRepository } from "../../../domain/artistProfiles/repositories";
import type { ArtistProfileView } from "../../../domain/artistProfiles/entities";
import { toView } from "../../../domain/artistProfiles/operations";
import {
  createUserNotFoundError,
  type UserNotFoundError,
} from "../../../domain/users/policies/assertRegistered";
import {
  createArtistNotFoundError,
  type ArtistNotFoundError,
} from "../../../domain/artists/policies/assertArtistExists";
import { type Result, ok, err } from "../../../utils/result";

export type GetMyProfileInput = {
  subId: string;
};

export type GetMyProfileOutput = {
  accountId: string;
  profile: ArtistProfileView | null;
};

export type GetMyProfileError = UserNotFoundError | ArtistNotFoundError;

export type GetMyProfileDeps = {
  userRepository: IUserRepository;
  artistRepository: IArtistRepository;
  artistProfileRepository: IArtistProfileRepository;
};

export const getMyProfileUseCase = async (
  input: GetMyProfileInput,
  deps: GetMyProfileDeps,
): Promise<Result<GetMyProfileOutput, GetMyProfileError>> => {
  const user = await deps.userRepository.findBySub(input.subId);
  if (!user) {
    return err(createUserNotFoundError());
  }

  const artist = await deps.artistRepository.findByUserId(user.getId());
  if (!artist) {
    return err(createArtistNotFoundError());
  }

  const profile = await deps.artistProfileRepository.findByArtistId(
    artist.getArtistId(),
  );

  return ok({
    accountId: artist.getAccountId(),
    profile: profile ? toView(profile) : null,
  });
};
