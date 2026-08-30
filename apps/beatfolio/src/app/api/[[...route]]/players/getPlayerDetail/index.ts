import { Hono } from "hono";
import type { RequestContextEnv } from "../../../../../middlewares/requestContext";
import { resolveLinkLabels } from "../../shared/resolveLinkLabels";
import { toUpstreamError } from "../../shared/toUpstreamError";
import { readUpstreamJson } from "../../shared/readUpstreamJson";
import { createPlayerNotFoundError } from "../../errors/playerNotFound";

const app = new Hono<RequestContextEnv>().get("/:accountId", async (c) => {
  const apiClient = c.get("apiClient");
  const accountId = c.req.param("accountId");

  const [profileRes, linkTypesRes] = await Promise.all([
    apiClient.api.artists[":accountId"].$get({ param: { accountId } }),
    apiClient.api["link-types"].$get(),
  ]);

  if (profileRes.status === 404 || profileRes.status === 422) {
    throw createPlayerNotFoundError();
  }
  if (!profileRes.ok) throw await toUpstreamError(profileRes);
  if (!linkTypesRes.ok) throw await toUpstreamError(linkTypesRes);

  const { profile } = await readUpstreamJson(profileRes);
  const { linkTypes } = await readUpstreamJson(linkTypesRes);

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
