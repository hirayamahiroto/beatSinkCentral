import { hc } from "hono/client";
import type { AppType } from "./../../../../api-server/src/app/api/[[...route]]/route";
import type { AppType as BeatfolioBffAppType } from "../../app/api/[[...route]]/route";
import { bffServerConfig } from "../config";

type ClientOptions = {
  cookie?: string;
};

export const createBffServerClient = (options?: ClientOptions) => {
  if (!bffServerConfig.baseUrl) {
    throw new Error("API_SERVER_BASE_URL is not set");
  }

  return hc<AppType>(bffServerConfig.baseUrl, {
    headers: options?.cookie ? { cookie: options.cookie } : undefined,
  });
};

/**
 * Client Component から beatfolio BFF (`/api/*`) を呼び出すための Hono クライアント。
 * 同一オリジン (相対パス) で動作する。BFF が api-server へ転送する。
 */
export const createBeatfolioBffClient = () => hc<BeatfolioBffAppType>("/");
