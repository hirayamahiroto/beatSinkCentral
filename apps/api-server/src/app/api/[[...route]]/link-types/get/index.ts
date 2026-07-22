import { Hono } from "hono";
import { getContainer } from "../../../../../infrastructure/container";
import { listLinkTypesUseCase } from "../../../../../usecases/linkTypes/listLinkTypes";

const app = new Hono().get("/", async (c) => {
  const { linkTypeRepository } = getContainer();

  const result = await listLinkTypesUseCase({ linkTypeRepository });

  return c.json(result);
});

export default app;
