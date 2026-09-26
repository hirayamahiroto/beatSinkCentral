import { Hono } from "hono";
import type { RequestContextEnv } from "../../../../../middlewares/requestContext";
import { resolveLinkLabels } from "../../shared/resolveLinkLabels";
import { resolveStoryQuestionLabels } from "../../shared/resolveStoryQuestionLabels";
import { resolvePresentationPattern } from "../../shared/resolvePresentationPattern";
import { toUpstreamError } from "../../shared/toUpstreamError";
import { readUpstreamJson } from "../../shared/readUpstreamJson";
import { createPlayerNotFoundError } from "../../errors/playerNotFound";
import { throwBffError } from "../../../../../errorMap";

const app = new Hono<RequestContextEnv>().get("/:handle/concept", async (c) => {
  const apiClient = c.get("apiClient");
  const handle = c.req.param("handle");

  const [profileRes, linkTypesRes, storyQuestionsRes] = await Promise.all([
    apiClient.api.artists[":handle"].$get({ param: { handle } }),
    apiClient.api["link-types"].$get(),
    apiClient.api["story-questions"].$get(),
  ]);

  if (profileRes.status === 404 || profileRes.status === 422) {
    throwBffError(createPlayerNotFoundError());
  }
  if (!profileRes.ok) throwBffError(await toUpstreamError(profileRes));
  if (!linkTypesRes.ok) throwBffError(await toUpstreamError(linkTypesRes));
  if (!storyQuestionsRes.ok)
    throwBffError(await toUpstreamError(storyQuestionsRes));

  const { profile } = await readUpstreamJson(profileRes);
  const { linkTypes } = await readUpstreamJson(linkTypesRes);
  const { storyQuestions } = await readUpstreamJson(storyQuestionsRes);

  return c.json({
    patternCode: resolvePresentationPattern(profile.presentation.patternCode),
    name: profile.attributes.name,
    tagline: profile.attributes.tagline,
    heroImageUrl: profile.attributes.imageUrl,
    genres: profile.attributes.genres,
    activityInfo: profile.attributes.activityInfo,
    chapters: resolveStoryQuestionLabels(
      profile.story.chapters,
      storyQuestions,
    ),
    links: resolveLinkLabels(profile.links, linkTypes),
    primaryAction: null,
  });
});

export default app;
