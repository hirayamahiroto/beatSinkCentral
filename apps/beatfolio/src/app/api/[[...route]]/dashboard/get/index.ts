import { Hono } from "hono";
import type { RequestContextEnv } from "../../../../../middlewares/requestContext";
import { resolvePublishRequirementLabels } from "../../shared/resolvePublishRequirementLabels";

const app = new Hono<RequestContextEnv>().get("/", async (c) => {
  const apiClient = c.get("apiClient");

  const res = await apiClient.api.users.me.$get();

  if (!res.ok) {
    return c.json({ error: "Failed to fetch dashboard" }, 502);
  }

  const me = await res.json();

  if (!me.registered) {
    return c.json({ registered: false as const });
  }

  if (me.artist === null) {
    return c.json({ registered: true as const, artist: null });
  }

  const profileRes = await apiClient.api.artists[":artistId"].profile.$get({
    param: { artistId: me.artist.artistId },
  });

  if (!profileRes.ok) {
    return c.json({ error: "Failed to fetch dashboard" }, 502);
  }

  const { profile, missingPublishFields } = await profileRes.json();

  if (profile === null || missingPublishFields === null) {
    return c.json({
      registered: true as const,
      artist: { accountId: me.artist.accountId, profile: null },
    });
  }

  return c.json({
    registered: true as const,
    artist: {
      accountId: me.artist.accountId,
      profile: {
        published: profile.published,
        missingPublishRequirements:
          resolvePublishRequirementLabels(missingPublishFields),
      },
    },
  });
});

export default app;
