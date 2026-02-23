import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { auth0 } from "../../../../../infrastructure/auth0";
import { getContainer } from "../../../../../infrastructure/container";
import { createUserUseCase } from "../../../../../usecases/users";

const requestSchema = z.object({
  email: z.string().email(),
});

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

    const { userRepository } = getContainer();
    const result = await createUserUseCase(
      {
        subId: session.user.sub,
        email: body.email,
      },
      userRepository
    );

    return c.json(
      {
        userId: result.userId,
      },
      201
    );
  }
);

export default app;
