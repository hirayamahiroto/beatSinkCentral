import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type BasicAuthConfig = {
  excludePaths?: string[];
};

export const createBasicAuthMiddleware = (config?: BasicAuthConfig) => {
  const excludePaths = config?.excludePaths ?? [];

  return (request: NextRequest): NextResponse | null => {
    // 除外パスはスキップ
    if (
      excludePaths.some((path) => request.nextUrl.pathname.startsWith(path))
    ) {
      return null;
    }

    // Basic認証が無効または設定されていない場合はスキップ
    if (
      process.env.ENABLE_BASIC_AUTH !== "true" ||
      !process.env.BASIC_AUTH_USERNAME ||
      !process.env.BASIC_AUTH_PASSWORD
    ) {
      return null;
    }

    const basicAuth = request.headers.get("authorization");

    if (basicAuth) {
      const authValue = basicAuth.split(" ")[1];
      const [username, password] = Buffer.from(authValue, "base64")
        .toString()
        .split(":");

      if (
        username === process.env.BASIC_AUTH_USERNAME &&
        password === process.env.BASIC_AUTH_PASSWORD
      ) {
        return null;
      }
    }

    return NextResponse.json(
      { error: "Basic Auth Required" },
      {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="Secure Area"',
        },
      }
    );
  };
};
