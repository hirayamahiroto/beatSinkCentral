import { Hono } from "hono";
import { z } from "zod";
import { getContainer } from "../../../../../infrastructure/container";
import { getMeUseCase } from "../../../../../usecases/users/getMe";
import { validateRequest } from "../../validators/validateRequest";

export const updateMyEmailRequestSchema = z.object({
  email: z
    .string({ required_error: "email is required" })
    .min(1, "email is required"),
});

export type UpdateMyEmailRequestBody = z.infer<
  typeof updateMyEmailRequestSchema
>;

const app = new Hono()
  .get("/", async (c) => {
    const auth0User = c.get("auth0User");

    const { userRepository, artistRepository } = getContainer();
    const result = await getMeUseCase(
      { subId: auth0User.sub },
      { userRepository, artistRepository },
    );

    return c.json(result);
  })
  .post("/", validateRequest("json", updateMyEmailRequestSchema), async (c) => {
    const body = c.req.valid("json");
    const auth0User = c.get("auth0User");

    const { updateMyEmail } = getContainer().usecases;

    const result = await updateMyEmail({
      subId: auth0User.sub,
      email: body.email,
    });

    return c.json(result);
  });

export default app;
