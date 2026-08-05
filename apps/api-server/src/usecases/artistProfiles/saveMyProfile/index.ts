import type { ArtistProfileView } from "../../../domain/artistProfiles/entities";
import {
  createArtistProfile,
  reviseArtistProfile,
  type ArtistProfileContent,
  type ArtistProfileContentError,
} from "../../../domain/artistProfiles/factories";
import type { WriteCapabilities } from "../../capabilities";
import { type Result, ok, err } from "../../../utils/result";

export type SaveMyProfileInput = ArtistProfileContent;

export type SaveMyProfileOutput = {
  accountId: string;
  profile: ArtistProfileView;
};

export type SaveMyProfileError = ArtistProfileContentError;

type SaveMyProfileCaps = Pick<WriteCapabilities, "actor" | "artistProfiles">;

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

  const saved = await caps.artistProfiles.upsert(profile.value.toPersistence());

  return ok({
    accountId: caps.actor.artist.getAccountId(),
    profile: saved.toView(),
  });
};
