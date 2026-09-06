import { Hono } from "hono";
import type { RequestContextEnv } from "../../../../../middlewares/requestContext";
import {
  resolveLinkLabels,
  type ResolvedLink,
} from "../../shared/resolveLinkLabels";
import { toUpstreamError } from "../../shared/toUpstreamError";
import { readUpstreamJson } from "../../shared/readUpstreamJson";
import { createPlayerNotFoundError } from "../../errors/playerNotFound";

const CURRENT_STORY_CHAPTER_QUESTION = "Story";

type StoryChapter = { key: string; body: string };

// T03② で章単位の区画表示に置き換えるまでの暫定措置。旧 story 相当の1本のテキストとして結合する
const joinChapterBodies = (chapters: StoryChapter[]): string =>
  chapters.map((chapter) => chapter.body).join("\n\n");

const toSupportLink = (link: ResolvedLink) => ({
  platform: link.type,
  url: link.url,
  label: link.label,
});

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

  const { artistId, profile } = await readUpstreamJson(profileRes);
  const { linkTypes } = await readUpstreamJson(linkTypesRes);

  return c.json({
    artistId,
    name: profile.attributes.name,
    tagline: profile.attributes.tagline,
    imageUrl: profile.attributes.imageUrl,
    genres: profile.attributes.genres,
    storyChapters: [
      {
        question: CURRENT_STORY_CHAPTER_QUESTION,
        body: joinChapterBodies(profile.story.chapters),
      },
    ],
    translation: null,
    listeningPoint: null,
    offer: null,
    supportLinks: resolveLinkLabels(profile.links, linkTypes).map(
      toSupportLink,
    ),
  });
});

export default app;
