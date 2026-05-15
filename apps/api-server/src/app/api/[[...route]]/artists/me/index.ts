import { Hono } from "hono";
import { z } from "zod";
import { getContainer } from "../../../../../infrastructure/container";
import { updateMyAccountIdUseCase } from "../../../../../usecases/users/updateMyAccountId";
import { validateRequest } from "../../validators/validateRequest";

export const updateMyAccountIdRequestSchema = z.object({
  accountId: z
    .string({ required_error: "accountId is required" })
    .min(1, "accountId is required"),
});

export type UpdateMyAccountIdRequestBody = z.infer<
  typeof updateMyAccountIdRequestSchema
>;

const app = new Hono().post(
  "/",
  validateRequest("json", updateMyAccountIdRequestSchema),
  async (c) => {
    const body = c.req.valid("json");
    const auth0User = c.get("auth0User");

    const { userRepository, artistRepository, txRunner } = getContainer();

    const result = await updateMyAccountIdUseCase(
      { subId: auth0User.sub, accountId: body.accountId },
      { userRepository, artistRepository, txRunner },
    );

    return c.json(result);
  },
);

export default app;
