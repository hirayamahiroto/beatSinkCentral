import { Hono } from "hono";
import {
  UserService,
  RegisterRequest,
} from "../../../../domain/services/user/humanBeatboxer";

// In-memory service instance (in production, use dependency injection)
const userService = new UserService();

const app = new Hono().post("/register", async (c) => {
  try {
    const body = (await c.req.json()) as RegisterRequest;

    if (!body.email || !body.password || !body.artistName) {
      return c.json(
        { error: "Missing required fields: email, password, artistName" },
        400
      );
    }

    if (!body.age || !body.sex) {
      return c.json({ error: "Missing required fields: age, sex" }, 400);
    }

    const result = await userService.register(body);

    return c.json(
      {
        success: true,
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
          },
          humanBeatboxer: result.humanBeatboxer.toJSON(),
          profile: result.profile.toJSON(),
        },
      },
      201
    );
  } catch (error) {
    console.error("Error registering HumanBeatboxer:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default app;
