import type { ArtistProfile } from "../../../domain/artistProfiles/entities";
import { enforcePublishInvariant } from "../../../domain/artistProfiles/policies/publishability";
import type { ArtistWriteCapabilities } from "../../capabilities";

type PersistMyProfileCaps = Pick<ArtistWriteCapabilities, "artistProfiles">;

export const persistMyProfile = (
  caps: PersistMyProfileCaps,
  profile: ArtistProfile,
): Promise<ArtistProfile> =>
  caps.artistProfiles.upsert(enforcePublishInvariant(profile).toPersistence());
