import { createMiddleware } from "hono/factory";
import { createBffServerClient } from "../../utils/client";

export type RequestContextEnv = {
  Variables: {
    apiClient: ReturnType<typeof createBffServerClient>;
  };
};

export const requestContextMiddleware = createMiddleware<RequestContextEnv>(
  async (c, next) => {
    const cookie = c.req.header("cookie");
    c.set("apiClient", createBffServerClient({ cookie }));
    await next();
  }
);
