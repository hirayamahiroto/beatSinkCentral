import { Hono } from "hono";
import {
  UserService,
  RegisterRequest,
} from "../../../../domain/services/user/humanBeatboxer";
import { userToJson } from "../../../../domain/entities/user";
import { humanBeatboxerToJson } from "../../../../domain/entities/HumanBeatboxer/toJson";
import { humanBeatboxerProfileToJson } from "../../../../domain/entities/HumanBeatboxer/profile/toJson";

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
          user: userToJson(result.user),
          humanBeatboxer: humanBeatboxerToJson(result.humanBeatboxer),
          profile: humanBeatboxerProfileToJson(result.profile),
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
