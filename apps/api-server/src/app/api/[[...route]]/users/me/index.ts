import { Hono } from "hono";
import { getContainer } from "../../../../../infrastructure/container";
import { getMeUseCase } from "../../../../../usecases/users/getMe";

const app = new Hono().get("/", async (c) => {
  const auth0User = c.get("auth0User");

  if (!auth0User.sub) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { userRepository, artistRepository } = getContainer();
  const result = await getMeUseCase(
    { subId: auth0User.sub },
    { userRepository, artistRepository }
  );

  return c.json(result);
});

export default app;
