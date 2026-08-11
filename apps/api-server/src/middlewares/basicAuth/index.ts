import { basicAuth } from "hono/basic-auth";
import { createMiddleware } from "hono/factory";

type BasicAuthCredentials = {
  username: string;
  password: string;
};

const INVALID_USER_MESSAGE = { error: "Basic Auth Required" };

export const readBasicAuthCredentials = (
  env: NodeJS.ProcessEnv,
): BasicAuthCredentials | null => {
  if (env.ENABLE_BASIC_AUTH !== "true") return null;

  const username = env.BASIC_AUTH_USERNAME;
  const password = env.BASIC_AUTH_PASSWORD;
  if (!username || !password) return null;

  return { username, password };
};

export const basicAuthMiddleware = createMiddleware((c, next) => {
  const credentials = readBasicAuthCredentials(process.env);
  if (credentials === null) return next();

  return basicAuth({
    ...credentials,
    invalidUserMessage: INVALID_USER_MESSAGE,
  })(c, next);
});
