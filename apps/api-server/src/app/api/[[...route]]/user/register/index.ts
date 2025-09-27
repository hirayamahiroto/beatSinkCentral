import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { register as userService } from "@beatSink/domain/services/user/register";
import { z } from "zod";

const request = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const app = new Hono().post(
  "/register",
  zValidator("json", request, (result, c) => {
    if (!result.success) {
      return c.text("Invalid!", 400);
    }
  }),
  async (c) => {
    const body = c.req.valid("json");
    const result = await userService(body);

    return c.json(
      {
        success: true,
        data: {
          user: result.user,
        },
      },
      201
    );
  }
);

export default app;
