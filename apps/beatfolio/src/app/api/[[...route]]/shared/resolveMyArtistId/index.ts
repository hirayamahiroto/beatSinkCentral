import type { createApiServerClient } from "../../../../../utils/client";

type ApiClient = ReturnType<typeof createApiServerClient>;

export type ResolveMyArtistIdResult =
  | { ok: true; artistId: string }
  | { ok: false; status: 404 | 502; body: { error: string } };

export const resolveMyArtistId = async (
  apiClient: ApiClient,
): Promise<ResolveMyArtistIdResult> => {
  const res = await apiClient.api.users.me.$get();

  if (!res.ok) {
    return {
      ok: false,
      status: 502,
      body: { error: "Failed to resolve artist" },
    };
  }

  const me = await res.json();

  if (!me.registered || me.artist === null) {
    return { ok: false, status: 404, body: { error: "Artist not found" } };
  }

  return { ok: true, artistId: me.artist.artistId };
};
