import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { NextRequest } from "next/server";
import { requireAuthMiddleware } from "../../../../../middlewares/auth0";
import { auth0 } from "../../../../../infrastructure/auth0";
import { db } from "../../../../../infrastructure/database";
import { createUserRepository } from "../../../../../infrastructure/repositories";
import { CreateUserUseCase } from "../../../../../usecases/users";

const requestSchema = z.object({
  username: z.string().min(1),
  attributes: z.record(z.unknown()).optional(),
});

// DI: リポジトリとユースケースの組み立て
const userRepository = createUserRepository(db);
const createUserUseCase = new CreateUserUseCase(userRepository);

const app = new Hono().post(
  "/",
  requireAuthMiddleware,
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

    const session = await auth0.getSession(c.req.raw as NextRequest);
    if (!session?.user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const auth0User = session.user;

    if (!auth0User.sub || !auth0User.email) {
      return c.json({ error: "Invalid user session" }, 401);
    }

    const result = await createUserUseCase.execute({
      auth0UserId: auth0User.sub,
      email: auth0User.email,
      username: body.username,
      attributes: body.attributes,
    });

    return c.json(
      {
        user: {
          auth0UserId: result.user.auth0UserId,
          email: result.user.email,
          username: result.user.username,
        },
        isArtist: result.isArtist,
      },
      201
    );
  }
);

export default app;
