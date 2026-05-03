import { createMiddleware } from "hono/factory";
import { auth0 } from "../../infrastructure/auth0";
import { createUnauthorizedError } from "./errors/unauthorized";

// Auth0セッションからユーザー情報の型を抽出
type Auth0Session = Awaited<ReturnType<typeof auth0.getSession>>;
type Auth0User = NonNullable<Auth0Session>["user"];

// Honoのコンテキスト変数に型を追加
declare module "hono" {
  interface ContextVariableMap {
    auth0User: Auth0User;
  }
}

export const requireAuthMiddleware = createMiddleware(async (c, next) => {
  const session = await auth0.getSession();
  if (!session?.user) {
    throw createUnauthorizedError();
  }

  c.set("auth0User", session.user);

  await next();
});
