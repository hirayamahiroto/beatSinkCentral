import { Hono } from "hono";
import {
  UserService,
  RegisterRequest,
  userToJson,
  humanBeatboxerToJson,
  humanBeatboxerProfileToJson,
} from "@beatSink/domain";

// In-memory service instance (in production, use dependency injection)
const userService = new UserService();

const app = new Hono().post("/register", async (c) => {
  try {
    const body = (await c.req.json()) as RegisterRequest;

    if (
      typeof body.email !== "string" ||
      typeof body.password !== "string" ||
      typeof body.artistName !== "string" ||
      !body.email.trim() ||
      !body.password.trim() ||
      !body.artistName.trim()
    ) {
      return c.json(
        { error: "Missing required fields: email, password, artistName" },
        400
      );
    }

    if (
      typeof body.age !== "number" ||
      !Number.isFinite(body.age) ||
      body.age <= 0 ||
      body.age > 120
    ) {
      return c.json({ error: "Invalid field: age must be 1-120 number" }, 400);
    }

    const allowedSex = ["male", "female", "other"];
    if (typeof body.sex !== "string" || !allowedSex.includes(body.sex)) {
      return c.json(
        { error: 'Invalid field: sex must be "male" | "female" | "other"' },
        400
      );
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
