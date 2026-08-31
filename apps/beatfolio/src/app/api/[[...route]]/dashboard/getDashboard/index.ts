import { Hono } from "hono";
import type { RequestContextEnv } from "../../../../../middlewares/requestContext";
import { resolvePublishRequirementLabels } from "../../shared/resolvePublishRequirementLabels";
import { toUpstreamError } from "../../shared/toUpstreamError";
import { readUpstreamJson } from "../../shared/readUpstreamJson";

const app = new Hono<RequestContextEnv>().get("/", async (c) => {
  const apiClient = c.get("apiClient");

  const res = await apiClient.api.users.me.$get();
  if (!res.ok) throw await toUpstreamError(res);

  const me = await readUpstreamJson(res);

  if (!me.registered) {
    return c.json({ registered: false as const });
  }

  if (me.artist === null) {
    return c.json({ registered: true as const, artist: null });
  }

  const profileRes = await apiClient.api.artists[":artistId"].profile.$get({
    param: { artistId: me.artist.artistId },
  });

  if (!profileRes.ok) throw await toUpstreamError(profileRes);

  const { profile, missingPublishFields } = await readUpstreamJson(profileRes);

  if (profile === null || missingPublishFields === null) {
    return c.json({
      registered: true as const,
      artist: { handle: me.artist.handle, profile: null },
    });
  }

  return c.json({
    registered: true as const,
    artist: {
      handle: me.artist.handle,
      profile: {
        published: profile.published,
        missingPublishRequirements:
          resolvePublishRequirementLabels(missingPublishFields),
      },
    },
  });
});

export default app;
