import { Hono } from "hono";
import type { RequestContextEnv } from "../../../../../middlewares/requestContext";
import { resolveLinkLabels } from "../../shared/resolveLinkLabels";
import { toUpstreamError } from "../../shared/toUpstreamError";
import { readUpstreamJson } from "../../shared/readUpstreamJson";
import { createPlayerNotFoundError } from "../../errors/playerNotFound";

const CURRENT_STORY_CHAPTER_QUESTION = "Story";

const app = new Hono<RequestContextEnv>().get("/:handle", async (c) => {
  const apiClient = c.get("apiClient");
  const handle = c.req.param("handle");

  const [profileRes, linkTypesRes] = await Promise.all([
    apiClient.api.artists[":handle"].$get({ param: { handle } }),
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
    genres: profile.genres,
    storyChapters: [
      { question: CURRENT_STORY_CHAPTER_QUESTION, body: profile.story },
    ],
    translation: null,
    listeningPoint: null,
    offer: null,
    supportLinks: resolveLinkLabels(profile.links, linkTypes),
  });
});

export default app;
