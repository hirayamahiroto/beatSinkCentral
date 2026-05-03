import { Hono } from "hono";
import { z } from "zod";
import { getContainer } from "../../../../../infrastructure/container";
import { createUserUseCase } from "../../../../../usecases/users/createUser";
import { validateRequest } from "../../validators/validateRequest";

export const requestSchema = z.object({
  email: z
    .string({ required_error: "email is required" })
    .min(1, "email is required")
    .email("Invalid email format"),
  accountId: z
    .string({ required_error: "accountId is required" })
    .min(1, "accountId is required")
    .max(255, "accountId must be 255 characters or less"),
});

export type CreateUserRequestBody = z.infer<typeof requestSchema>;

const app = new Hono().post(
  "/",
  validateRequest("json", requestSchema),
  async (c) => {
    const body = c.req.valid("json");
    const auth0User = c.get("auth0User");

    const { userRepository, artistRepository, txRunner } = getContainer();

    const result = await createUserUseCase(
      {
        subId: auth0User.sub,
        email: body.email,
        accountId: body.accountId,
      },
      {
        userRepository,
        artistRepository,
        txRunner,
      },
    );

    return c.json(
      {
        userId: result.userId,
        artistId: result.artistId,
      },
      201,
    );
  },
);

export default app;
