import { createMiddleware } from "hono/factory";
import { createApiServerClient } from "../../utils/client";

export type RequestContextEnv = {
  Variables: {
    apiClient: ReturnType<typeof createApiServerClient>;
  };
};

export const requestContextMiddleware = createMiddleware<RequestContextEnv>(
  async (c, next) => {
    const cookie = c.req.header("cookie");
    c.set("apiClient", createApiServerClient({ cookie }));
    await next();
  },
);
