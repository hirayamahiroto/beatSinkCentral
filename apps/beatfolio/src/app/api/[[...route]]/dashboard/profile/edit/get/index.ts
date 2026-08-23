import { Hono } from "hono";
import type { RequestContextEnv } from "../../../../../../../middlewares/requestContext";
import { toWizardValues } from "./toWizardValues";

const app = new Hono<RequestContextEnv>().get("/", async (c) => {
  const apiClient = c.get("apiClient");

  const [meRes, linkTypesRes] = await Promise.all([
    apiClient.api.users.me.$get(),
    apiClient.api["link-types"].$get(),
  ]);

  if (!meRes.ok || !linkTypesRes.ok) {
    return c.json({ error: "Failed to fetch profile edit screen" }, 502);
  }

  const me = await meRes.json();

  if (!me.registered) {
    return c.json({ registered: false as const });
  }

  if (me.artist === null) {
    return c.json({ error: "Failed to fetch profile edit screen" }, 502);
  }

  const profileRes = await apiClient.api.artists[":artistId"].profile.$get({
    param: { artistId: me.artist.artistId },
  });

  if (!profileRes.ok) {
    return c.json({ error: "Failed to fetch profile edit screen" }, 502);
  }

  const { profile } = await profileRes.json();
  const { linkTypes } = await linkTypesRes.json();

  return c.json({
    registered: true as const,
    email: me.email,
    linkTypeOptions: linkTypes,
    defaultValues: profile ? toWizardValues(profile) : null,
  });
});

export default app;
