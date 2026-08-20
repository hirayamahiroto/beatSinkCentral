import { Hono } from "hono";
import type { RequestContextEnv } from "../../../../../../../middlewares/requestContext";
import { toWizardValues } from "./toWizardValues";

const app = new Hono<RequestContextEnv>().get("/", async (c) => {
  const apiClient = c.get("apiClient");

  const [meRes, profileRes, linkTypesRes] = await Promise.all([
    apiClient.api.users.me.$get(),
    apiClient.api.artists.me.profile.$get(),
    apiClient.api["link-types"].$get(),
  ]);

  if (!meRes.ok || !profileRes.ok || !linkTypesRes.ok) {
    return c.json({ error: "Failed to fetch profile edit screen" }, 502);
  }

  const me = await meRes.json();

  if (!me.registered || me.artist === null) {
    return c.json({ registered: false as const });
  }

  const { profile } = await profileRes.json();
  const { linkTypes } = await linkTypesRes.json();

  return c.json({
    registered: true as const,
    email: me.email,
    artistId: me.artist.artistId,
    linkTypeOptions: linkTypes,
    defaultValues: profile ? toWizardValues(profile) : null,
  });
});

export default app;
