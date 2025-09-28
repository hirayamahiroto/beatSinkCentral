import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { audienceRegister } from "@beatSink/domain/services/user/audienceRegister";
import { z } from "zod";

const request = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const app = new Hono().post(
  "/register",
  zValidator("json", request, (result, c) => {
    if (!result.success) {
      return c.json({ error: "request is invalid" }, 400);
    }
  }),
  async (c) => {
    const body = c.req.valid("json");
    const result = await audienceRegister(body);

    return c.json(
      {
        user: result.user,
      },
      201
    );
  }
);

export default app;
