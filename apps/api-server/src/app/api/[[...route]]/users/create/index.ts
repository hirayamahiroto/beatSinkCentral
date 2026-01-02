import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { auth0 } from "../../../../../infrastructure/auth0";
import { getDb } from "../../../../../infrastructure/database";
import { createUserRepository } from "../../../../../infrastructure/repositories/userRepository";
import { CreateUserUseCase } from "../../../../../usecases/users";

const requestSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  accountId: z.string().min(1),
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

    const userRepository = createUserRepository(getDb());
    const createUserUseCase = new CreateUserUseCase(userRepository);
    const result = await createUserUseCase.execute({
      sub: session.user.sub,
      email: body.email,
      name: body.name,
      accountId: body.accountId,
    });

    return c.json(
      {
        user: {
          accountId: result.user.accountId,
          sub: result.user.sub,
          email: result.user.email,
          name: result.user.name,
        },
        isArtist: result.isArtist,
      },
      201
    );
  }
);

export default app;
