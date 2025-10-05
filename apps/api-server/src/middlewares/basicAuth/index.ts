import { createMiddleware } from "hono/factory";

export const basicAuthMiddleware = createMiddleware(async (c, next) => {
  if (
    process.env.ENABLE_BASIC_AUTH !== "true" ||
    !process.env.BASIC_AUTH_USERNAME ||
    !process.env.BASIC_AUTH_PASSWORD
  ) {
    return await next();
  }

  const basicAuth = c.req.header("authorization");

  if (basicAuth) {
    const authValue = basicAuth.split(" ")[1];
    const [username, password] = Buffer.from(authValue, "base64")
      .toString()
      .split(":");

    if (
      username === process.env.BASIC_AUTH_USERNAME &&
      password === process.env.BASIC_AUTH_PASSWORD
    ) {
      return await next();
    }
  }

  return c.json(
    { error: "Basic Auth Required" },
    401,
    {
      "WWW-Authenticate": 'Basic realm="Secure Area"',
    }
  );
});
