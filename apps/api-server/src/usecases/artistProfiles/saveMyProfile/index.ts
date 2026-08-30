import type { ArtistProfileView } from "../../../domain/artistProfiles/entities";
import {
  createArtistProfile,
  reviseArtistProfile,
  type ArtistProfileContent,
  type ArtistProfileContentError,
} from "../../../domain/artistProfiles/factories";
import { enforcePublishInvariant } from "../../../domain/artistProfiles/policies/publishability";
import type { ArtistWriteCapabilities } from "../../capabilities";
import { type Result, ok, err } from "../../../utils/result";

export type SaveMyProfileInput = ArtistProfileContent;

export type SaveMyProfileOutput = {
  accountId: string;
  profile: ArtistProfileView;
};

export type SaveMyProfileError = ArtistProfileContentError;

type SaveMyProfileCaps = Pick<
  ArtistWriteCapabilities,
  "actor" | "artistProfiles"
>;

export const saveMyProfile = async (
  caps: SaveMyProfileCaps,
  content: SaveMyProfileInput,
): Promise<Result<SaveMyProfileOutput, SaveMyProfileError>> => {
  const artistId = caps.actor.artist.getArtistId();
  const existing = await caps.artistProfiles.findByArtistId(artistId);

  const profile = existing
    ? reviseArtistProfile({
        id: existing.getId(),
        artistId,
        published: existing.isPublished(),
        ...content,
      })
    : createArtistProfile({ artistId, ...content });
  if (!profile.ok) return err(profile.error);

  const saved = await caps.artistProfiles.upsert(
    enforcePublishInvariant(profile.value).toPersistence(),
  );

  return ok({
    accountId: caps.actor.artist.getAccountId(),
    profile: saved.toView(),
  });
};
