import { Hono } from "hono";
import type { RequestContextEnv } from "../../../../../../middlewares/requestContext";
import { resolveLinkLabels } from "../../../shared/resolveLinkLabels";

const app = new Hono<RequestContextEnv>().get("/:accountId", async (c) => {
  const apiClient = c.get("apiClient");
  const accountId = c.req.param("accountId");

  const [profileRes, linkTypesRes] = await Promise.all([
    apiClient.api.artists[":accountId"].$get({ param: { accountId } }),
    apiClient.api["link-types"].$get(),
  ]);

  if (profileRes.status === 404) {
    return c.json({ error: "Player profile not found" }, 404);
  }
  if (!profileRes.ok || !linkTypesRes.ok) {
    return c.json({ error: "Failed to fetch player profile" }, 502);
  }

  const { profile } = await profileRes.json();
  const { linkTypes } = await linkTypesRes.json();

  return c.json({
    name: profile.name,
    tagline: profile.tagline,
    imageUrl: profile.imageUrl,
    story: profile.story,
    activityInfo: profile.activityInfo,
    genres: profile.genres,
    links: resolveLinkLabels(profile.links, linkTypes),
  });
});

export default app;
