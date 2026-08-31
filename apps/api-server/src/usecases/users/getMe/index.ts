import type { IdentityCapabilities } from "../../capabilities";
import { type Result, ok } from "../../../utils/result";

type GetMeOutputNotRegistered = {
  registered: false;
};

type GetMeOutputRegistered = {
  registered: true;
  userId: string;
  email: string;
  artist: {
    artistId: string;
    handle: string;
    hasProfile: boolean;
  } | null;
};

export type GetMeOutput = GetMeOutputNotRegistered | GetMeOutputRegistered;

type GetMeCaps = Pick<IdentityCapabilities, "actorResolution">;

export const getMe = async (
  caps: GetMeCaps,
): Promise<Result<GetMeOutput, never>> => {
  const resolution = caps.actorResolution;

  switch (resolution.status) {
    case "unregistered":
      return ok({ registered: false });

    case "userOnly":
      return ok({
        registered: true,
        userId: resolution.user.getId(),
        email: resolution.user.getEmail(),
        artist: null,
      });

    case "complete":
      return ok({
        registered: true,
        userId: resolution.actor.user.getId(),
        email: resolution.actor.user.getEmail(),
        artist: {
          artistId: resolution.actor.artist.getArtistId(),
          handle: resolution.actor.artist.getHandle(),
          hasProfile: resolution.actor.artist.hasProfile(),
        },
      });
  }
};
