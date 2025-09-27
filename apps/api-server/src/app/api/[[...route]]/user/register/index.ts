import { Hono } from "hono";
import {
  RegisterRequest,
  register as userService,
} from "@beatSink/domain/services/user/register";

const app = new Hono().post("/register", async (c) => {
  try {
    const body = (await c.req.json()) as RegisterRequest;

    if (
      typeof body.email !== "string" ||
      typeof body.password !== "string" ||
      !body.email.trim() ||
      !body.password.trim()
    ) {
      return c.json({ error: "Missing required fields: email, password" }, 400);
    }

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
  } catch (error) {
    console.error("Error registering user:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default app;
