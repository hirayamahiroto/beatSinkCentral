import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { auth0 } from "../../../../../infrastructure/auth0";
import { getContainer } from "../../../../../infrastructure/container";
import { createUserUseCase } from "../../../../../usecases/users/createUser";
import { isUserAlreadyRegisteredError } from "../../../../../usecases/users/createUser/errors";
import { isAccountIdAlreadyTakenError } from "../../../../../domain/artists/errors";

export const requestSchema = z.object({
  email: z.string().min(1),
  accountId: z.string().min(1),
});

export type CreateUserRequestBody = z.infer<typeof requestSchema>;

const app = new Hono().post(
  "/",
  zValidator("json", requestSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        { error: "Invalid request", issues: result.error.issues },
        400
      );
    }
  }),
  async (c) => {
    const body = c.req.valid("json");
    const session = await auth0.getSession();

    if (!session || !session.user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { userRepository, artistRepository, txRunner } = getContainer();

    try {
      const result = await createUserUseCase(
        {
          subId: session.user.sub,
          email: body.email,
          accountId: body.accountId,
        },
        {
          userRepository,
          artistRepository,
          txRunner,
        }
      );

      return c.json(
        {
          userId: result.userId,
          artistId: result.artistId,
        },
        201
      );
    } catch (error) {
      if (isUserAlreadyRegisteredError(error)) {
        return c.json({ error: "User already registered" }, 409);
      }
      if (isAccountIdAlreadyTakenError(error)) {
        return c.json({ error: "Account ID already taken" }, 409);
      }
      throw error;
    }
  }
);

export default app;
