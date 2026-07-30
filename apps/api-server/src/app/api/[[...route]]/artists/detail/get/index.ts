import { Hono } from "hono";
import { getContainer } from "../../../../../../infrastructure/container";
import { getPublicProfileUseCase } from "../../../../../../usecases/artistProfiles/getPublicProfile";
import { handleAppError } from "../../../../../../errorMap";

const app = new Hono().get("/:accountId", async (c) => {
  const accountId = c.req.param("accountId");
  const { artistProfileRepository } = getContainer();

  const result = await getPublicProfileUseCase(
    { accountId },
    { artistProfileRepository },
  );

  if (!result.ok) {
    return handleAppError(result.error, c);
  }

  return c.json(result.value);
});

export default app;
