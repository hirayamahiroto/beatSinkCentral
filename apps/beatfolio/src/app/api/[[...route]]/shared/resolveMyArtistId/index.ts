import type { createApiServerClient } from "../../../../../utils/client";
import { createMyArtistNotFoundError } from "../../errors/myArtistNotFound";
import { toUpstreamError } from "../toUpstreamError";
import { readUpstreamJson } from "../readUpstreamJson";
import { throwBffError } from "../../../../../errorMap";

type ApiClient = ReturnType<typeof createApiServerClient>;
type UsersMeClient = {
  api: { users: { me: Pick<ApiClient["api"]["users"]["me"], "$get"> } };
};

export const resolveMyArtistId = async (
  apiClient: UsersMeClient,
): Promise<string> => {
  const res = await apiClient.api.users.me.$get();
  if (!res.ok) throwBffError(await toUpstreamError(res));

  const me = await readUpstreamJson(res);
  if (!me.registered || me.artist === null) {
    throwBffError(createMyArtistNotFoundError());
  }

  return me.artist.artistId;
};
