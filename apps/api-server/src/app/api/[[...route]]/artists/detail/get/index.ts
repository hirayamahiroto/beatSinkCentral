import { Hono } from "hono";
import { getContainer } from "../../../../../../infrastructure/container";
import { getPublicProfileUseCase } from "../../../../../../usecases/artistProfiles/getPublicProfile";

const app = new Hono().get("/:accountId", async (c) => {
  const accountId = c.req.param("accountId");
  const { artistProfileRepository } = getContainer();

  const result = await getPublicProfileUseCase(
    { accountId },
    { artistProfileRepository },
  );

  return c.json(result);
});

export default app;
