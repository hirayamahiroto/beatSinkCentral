import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const requestSchema = z.object({
  email: z.string().email(),
  username: z.string().min(1),
  attributes: z.record(z.unknown()).optional(),
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

    // TODO: RegisterUserUseCaseを呼び出す
    // const registerUserUseCase = new RegisterUserUseCase(userRepository);
    // const result = await registerUserUseCase.execute(body);

    return c.json(
      {
        user: {
          id: "dummy-id",
          email: body.email,
          username: body.username,
        },
        isArtist: false,
      },
      201
    );
  }
);

export default app;
