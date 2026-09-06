import { Hono } from "hono";
import type { RequestContextEnv } from "../../../../../middlewares/requestContext";
import { resolvePublishRequirementLabels } from "../../shared/resolvePublishRequirementLabels";
import { toUpstreamError } from "../../shared/toUpstreamError";
import { readUpstreamJson } from "../../shared/readUpstreamJson";
import { resolvePresentationPattern } from "../../shared/resolvePresentationPattern";
import { toOfferEditorValues } from "./toOfferEditorValues";

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

  const [profileRes, presentationPatternsRes] = await Promise.all([
    apiClient.api.artists[":artistId"].profile.$get({
      param: { artistId: me.artist.artistId },
    }),
    apiClient.api["presentation-patterns"].$get(),
  ]);

  if (!profileRes.ok) throw await toUpstreamError(profileRes);
  if (!presentationPatternsRes.ok) {
    throw await toUpstreamError(presentationPatternsRes);
  }

  const { profile, publishability, offer } = await readUpstreamJson(profileRes);
  const { presentationPatterns } = await readUpstreamJson(
    presentationPatternsRes,
  );
  const offerEditorValues = offer === null ? null : toOfferEditorValues(offer);

  if (profile === null || publishability === null) {
    return c.json({
      registered: true as const,
      artist: {
        handle: me.artist.handle,
        profile: null,
        offer: offerEditorValues,
      },
    });
  }

  return c.json({
    registered: true as const,
    artist: {
      handle: me.artist.handle,
      profile: {
        published: profile.published,
        missingPublishRequirements: resolvePublishRequirementLabels(
          publishability.missingFields,
        ),
        presentation: {
          patternCode: resolvePresentationPattern(
            profile.presentation.patternCode,
          ),
          options: presentationPatterns,
        },
      },
      offer: offerEditorValues,
    },
  });
});

export default app;
