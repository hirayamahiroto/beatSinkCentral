import { Hono } from "hono";
import { getContainer } from "../../../../../../../infrastructure/container";
import { getMyProfileUseCase } from "../../../../../../../usecases/artistProfiles/getMyProfile";
import { handleAppError } from "../../../../../../../errorMap";

const app = new Hono().get("/", async (c) => {
  const auth0User = c.get("auth0User");
  const { userRepository, artistRepository, artistProfileRepository } =
    getContainer();

  const result = await getMyProfileUseCase(
    { subId: auth0User.sub },
    { userRepository, artistRepository, artistProfileRepository },
  );

  if (!result.ok) {
    return handleAppError(result.error, c);
  }

  return c.json(result.value);
});

export default app;
