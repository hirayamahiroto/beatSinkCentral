import type { InferResponseType } from "hono/client";
import type { createApiServerClient } from "../../../../../utils/client";

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
          { ok: true; json: () => Promise<UsersMeSuccess> } | { ok: false }
        >;
      };
    };
  };
};

export type ResolveMyUserIdResult =
  | { ok: true; userId: string }
  | { ok: false; status: 404 | 502; body: { error: string } };

export const resolveMyUserId = async (
  apiClient: UsersMeClient,
): Promise<ResolveMyUserIdResult> => {
  const res = await apiClient.api.users.me.$get();

  if (!res.ok) {
    return {
      ok: false,
      status: 502,
      body: { error: "Failed to resolve user" },
    };
  }

  const me = await res.json();

  if (!me.registered) {
    return { ok: false, status: 404, body: { error: "User not found" } };
  }

  return { ok: true, userId: me.userId };
};
