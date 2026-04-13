import { Hono } from "hono";
import { z } from "zod";
import { getContainer } from "../../../../../infrastructure/container";
import { getMeUseCase } from "../../../../../usecases/users/getMe";

const responseSchema = z.discriminatedUnion("registered", [
  z.object({
    registered: z.literal(false),
  }),
  z.object({
    registered: z.literal(true),
    userId: z.string(),
    email: z.string(),
    artist: z
      .object({
        artistId: z.string(),
        accountId: z.string(),
        hasProfile: z.boolean(),
      })
      .nullable(),
  }),
]);

const app = new Hono().get("/", async (c) => {
  const auth0User = c.get("auth0User");

  if (!auth0User.sub) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const { userRepository, artistRepository } = getContainer();
    const result = await getMeUseCase(
      { subId: auth0User.sub },
      { userRepository, artistRepository }
    );

    const parsed = responseSchema.safeParse(result);
    if (!parsed.success) {
      console.error("Unexpected response from getMeUseCase:", parsed.error);
      return c.json({ error: "Internal server error" }, 500);
    }

    return c.json(parsed.data);
  } catch (error) {
    console.error("Failed to get user info:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default app;
