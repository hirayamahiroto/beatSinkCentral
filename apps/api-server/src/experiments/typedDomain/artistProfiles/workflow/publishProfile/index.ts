import type { Result } from "../../../shared/result";
import type { DraftProfile, PublishedProfile } from "../../profile";
import {
  assertProfilePublishable,
  type ProfileNotPublishableError,
} from "../../policies";

export type { ProfileNotPublishableError };

export const publishProfile = (
  draft: DraftProfile,
): Result<PublishedProfile, ProfileNotPublishableError> =>
  assertProfilePublishable(draft);
