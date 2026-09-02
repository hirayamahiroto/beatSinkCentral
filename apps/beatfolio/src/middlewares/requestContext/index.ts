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
    const userAgent = c.req.header("user-agent");
    c.set("apiClient", createApiServerClient({ cookie, userAgent }));
    await next();
  },
);
