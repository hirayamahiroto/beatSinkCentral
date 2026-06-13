import { Hono } from "hono";
import { getContainer } from "../../../../../../../infrastructure/container";
import { getMyProfileUseCase } from "../../../../../../../usecases/artistProfiles/getMyProfile";

const app = new Hono().get("/", async (c) => {
  const auth0User = c.get("auth0User");
  const { userRepository, artistRepository, artistProfileRepository } =
    getContainer();

  const result = await getMyProfileUseCase(
    { subId: auth0User.sub },
    { userRepository, artistRepository, artistProfileRepository },
  );

  return c.json(result);
});

export default app;
