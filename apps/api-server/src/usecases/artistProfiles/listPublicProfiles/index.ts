import type { PublishedProfileSummary } from "../../../domain/artistProfiles/repositories";
import type { PublicReadCapabilities } from "../../capabilities";
import { type Result, ok } from "../../../utils/result";

const MAX_PROFILES = 100;

export type ListPublicProfilesOutput = {
  profiles: PublishedProfileSummary[];
};

type ListPublicProfilesCaps = Pick<PublicReadCapabilities, "artistProfiles">;

export const listPublicProfiles = async (
  caps: ListPublicProfilesCaps,
): Promise<Result<ListPublicProfilesOutput, never>> => {
  const profiles = await caps.artistProfiles.listPublishedSummaries({
    limit: MAX_PROFILES,
  });

  return ok({ profiles });
};
