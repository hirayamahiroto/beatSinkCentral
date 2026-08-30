import type { InferResponseType } from "hono/client";
import type { createApiServerClient } from "../../../../../utils/client";
import { createMyArtistNotFoundError } from "../../errors/myArtistNotFound";
import { toUpstreamError, type UpstreamResponse } from "../toUpstreamError";
import { readUpstreamJson } from "../readUpstreamJson";

type ApiClient = ReturnType<typeof createApiServerClient>;
type UsersMeSuccess = InferResponseType<
  ApiClient["api"]["users"]["me"]["$get"],
  200
>;

type UsersMeClient = {
  api: {
    users: {
      me: {
        $get: () => Promise<
          | { ok: true; status: number; json: () => Promise<UsersMeSuccess> }
          | ({ ok: false } & UpstreamResponse)
        >;
      };
    };
  };
};

export const resolveMyArtistId = async (
  apiClient: UsersMeClient,
): Promise<string> => {
  const res = await apiClient.api.users.me.$get();
  if (!res.ok) throw await toUpstreamError(res);

  const me = await readUpstreamJson(res);
  if (!me.registered || me.artist === null) {
    throw createMyArtistNotFoundError();
  }

  return me.artist.artistId;
};
