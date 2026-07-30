import type { IArtistProfileRepository } from "../../../domain/artistProfiles/repositories";
import type { PublishedProfileView } from "../../../domain/artistProfiles/entities";
import { toPublishedView } from "../../../domain/artistProfiles/operations";
import {
  createArtistProfileNotFoundError,
  type ArtistProfileNotFoundError,
} from "../../../domain/artistProfiles/policies/assertArtistProfileExists";
import { type Result, ok, err } from "../../../utils/result";

export type GetPublicProfileInput = {
  accountId: string;
};

export type GetPublicProfileOutput = {
  accountId: string;
  profile: PublishedProfileView;
};

export type GetPublicProfileError = ArtistProfileNotFoundError;

export type GetPublicProfileDeps = {
  artistProfileRepository: IArtistProfileRepository;
};

export const getPublicProfileUseCase = async (
  input: GetPublicProfileInput,
  deps: GetPublicProfileDeps,
): Promise<Result<GetPublicProfileOutput, GetPublicProfileError>> => {
  const profile = await deps.artistProfileRepository.findPublishedByAccountId(
    input.accountId,
  );
  if (!profile) {
    return err(createArtistProfileNotFoundError());
  }

  return ok({
    accountId: input.accountId,
    profile: toPublishedView(profile),
  });
};
