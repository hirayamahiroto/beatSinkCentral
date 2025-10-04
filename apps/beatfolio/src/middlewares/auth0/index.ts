import type { NextRequest } from "next/server";
import { auth0 } from "../../libs/auth0";

export async function middleware(request: NextRequest) {
  return await auth0.middleware(request);
}
