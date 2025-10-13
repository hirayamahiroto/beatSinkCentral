import { createMiddleware } from "hono/factory";
import { NextRequest } from "next/server";
import { auth0 } from "../../infrastructure/auth0";

// Auth0セッションからユーザー情報の型を抽出
type Auth0Session = Awaited<ReturnType<typeof auth0.getSession>>;
type Auth0User = NonNullable<Auth0Session>["user"];

// Honoのコンテキスト変数に型を追加
declare module "hono" {
  interface ContextVariableMap {
    auth0User: Auth0User;
  }
}

/**
 * Auth0認証ミドルウェア
 *
 * 機能:
 * - Auth0セッションの検証
 * - セッションからユーザー情報を取得してコンテキストに設定
 * - 認証が必要なエンドポイントで使用
 */
export const requireAuthMiddleware = createMiddleware(async (c, next) => {
  // Auth0のセッションを取得
  const session = await auth0.getSession(c.req.raw as NextRequest);

  if (!session?.user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // コンテキストにAuth0ユーザー情報を設定
  c.set("auth0User", session.user);

  await next();
});

/**
 * メール検証済みユーザーのみを許可するミドルウェア
 *
 * 機能:
 * - email_verifiedクレームをチェック
 * - 未検証の場合は403エラーを返す
 * - requireAuthMiddlewareの後に適用する必要がある
 */
export const requireVerifiedMiddleware = createMiddleware(async (c, next) => {
  const auth0User = c.get("auth0User");

  if (!auth0User) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  if (!auth0User.email_verified) {
    return c.json(
      {
        error: "Email not verified",
        message: "Please verify your email address to access this resource",
      },
      403
    );
  }

  await next();
});
