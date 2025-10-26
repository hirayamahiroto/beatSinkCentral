import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { requireAuthMiddleware } from "../../../../../middlewares/auth0";

const requestSchema = z.object({
  username: z.string().min(1),
  attributes: z.record(z.unknown()).optional(),
});

const app = new Hono().post(
  "/create",
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

    // ミドルウェアで設定されたAuth0ユーザー情報を取得
    const auth0User = c.get("auth0User");

    // TODO: CreateUserUseCaseを呼び出す
    // const createUserUseCase = new CreateUserUseCase(userRepository);
    // const result = await createUserUseCase.execute({
    //   auth0UserId: auth0User.sub,
    //   email: auth0User.email,
    //   username: body.username,
    //   attributes: body.attributes,
    // });

    return c.json(
      {
        user: {
          id: "dummy-id",
          auth0UserId: auth0User.sub,
          email: auth0User.email,
          username: body.username,
        },
        isArtist: false,
      },
      201
    );
  }
);

export default app;
