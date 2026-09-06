import { Hono } from "hono";
import type { RequestContextEnv } from "../../../../../middlewares/requestContext";
import { resolveLinkLabels } from "../../shared/resolveLinkLabels";
import { resolveStoryQuestionLabels } from "../../shared/resolveStoryQuestionLabels";
import { toUpstreamError } from "../../shared/toUpstreamError";
import { readUpstreamJson } from "../../shared/readUpstreamJson";
import { createPlayerNotFoundError } from "../../errors/playerNotFound";

const app = new Hono<RequestContextEnv>().get("/:handle", async (c) => {
  const apiClient = c.get("apiClient");
  const handle = c.req.param("handle");

  const [profileRes, linkTypesRes, storyQuestionsRes] = await Promise.all([
    apiClient.api.artists[":handle"].$get({ param: { handle } }),
    apiClient.api["link-types"].$get(),
    apiClient.api["story-questions"].$get(),
  ]);

  if (profileRes.status === 404 || profileRes.status === 422) {
    throw createPlayerNotFoundError();
  }
  if (!profileRes.ok) throw await toUpstreamError(profileRes);
  if (!linkTypesRes.ok) throw await toUpstreamError(linkTypesRes);
  if (!storyQuestionsRes.ok) throw await toUpstreamError(storyQuestionsRes);

  const { artistId, profile } = await readUpstreamJson(profileRes);
  const { linkTypes } = await readUpstreamJson(linkTypesRes);
  const { storyQuestions } = await readUpstreamJson(storyQuestionsRes);

  return c.json({
    artistId,
    name: profile.attributes.name,
    tagline: profile.attributes.tagline,
    imageUrl: profile.attributes.imageUrl,
    genres: profile.attributes.genres,
    storyChapters: resolveStoryQuestionLabels(
      profile.story.chapters,
      storyQuestions,
    ).map((chapter) => ({ question: chapter.label, body: chapter.body })),
    translation: null,
    listeningPoint: null,
    offer: null,
    supportLinks: resolveLinkLabels(profile.links, linkTypes),
  });
});

export default app;
