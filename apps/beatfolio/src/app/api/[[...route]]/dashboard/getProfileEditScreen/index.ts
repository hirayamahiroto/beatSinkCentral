import { Hono } from "hono";
import type { RequestContextEnv } from "../../../../../middlewares/requestContext";
import { toUpstreamError } from "../../shared/toUpstreamError";
import { readUpstreamJson } from "../../shared/readUpstreamJson";
import { createMyArtistNotFoundError } from "../../errors/myArtistNotFound";
import { toWizardValues } from "./toWizardValues";

const app = new Hono<RequestContextEnv>().get("/", async (c) => {
  const apiClient = c.get("apiClient");

  const [meRes, linkTypesRes, storyQuestionsRes] = await Promise.all([
    apiClient.api.users.me.$get(),
    apiClient.api["link-types"].$get(),
    apiClient.api["story-questions"].$get(),
  ]);
  if (!meRes.ok) throw await toUpstreamError(meRes);
  if (!linkTypesRes.ok) throw await toUpstreamError(linkTypesRes);
  if (!storyQuestionsRes.ok) throw await toUpstreamError(storyQuestionsRes);

  const me = await readUpstreamJson(meRes);

  if (!me.registered) {
    return c.json({ registered: false as const });
  }
  if (me.artist === null) throw createMyArtistNotFoundError();

  const profileRes = await apiClient.api.artists[":artistId"].profile.$get({
    param: { artistId: me.artist.artistId },
  });
  if (!profileRes.ok) throw await toUpstreamError(profileRes);

  const { profile } = await readUpstreamJson(profileRes);
  const { linkTypes } = await readUpstreamJson(linkTypesRes);
  const { storyQuestions } = await readUpstreamJson(storyQuestionsRes);

  return c.json({
    registered: true as const,
    email: me.email,
    linkTypeOptions: linkTypes,
    storyQuestions,
    defaultValues: profile ? toWizardValues(profile) : null,
  });
});

export default app;
