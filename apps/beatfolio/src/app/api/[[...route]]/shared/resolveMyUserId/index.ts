import type { createApiServerClient } from "../../../../../utils/client";
import { createMyUserNotFoundError } from "../../errors/myUserNotFound";
import { toUpstreamError } from "../toUpstreamError";
import { readUpstreamJson } from "../readUpstreamJson";
import { throwBffError } from "../../../../../errorMap";

type ApiClient = ReturnType<typeof createApiServerClient>;
type UsersMeClient = {
  api: { users: { me: Pick<ApiClient["api"]["users"]["me"], "$get"> } };
};

export const resolveMyUserId = async (
  apiClient: UsersMeClient,
): Promise<string> => {
  const res = await apiClient.api.users.me.$get();
  if (!res.ok) throwBffError(await toUpstreamError(res));

  const me = await readUpstreamJson(res);
  if (!me.registered) throwBffError(createMyUserNotFoundError());

  return me.userId;
};
