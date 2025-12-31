import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createBasicAuthMiddleware } from "./middlewares/basicAuth/nextjs";

const basicAuthMiddleware = createBasicAuthMiddleware({
  excludePaths: ["/auth"],
});

export function middleware(request: NextRequest) {
  const basicAuthResponse = basicAuthMiddleware(request);
  if (basicAuthResponse) {
    return basicAuthResponse;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
