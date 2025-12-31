import { hc } from "hono/client";
import type { AppType } from "./../../../../api-server/src/app/api/[[...route]]/route";
import { bffServerConfig } from "../config";

type ClientOptions = {
  cookie?: string;
};

export const createBffServerClient = (options?: ClientOptions) => {
  if (!bffServerConfig.baseUrl) {
    throw new Error("BFF_SERVER_BASE_URL is not set");
  }

  return hc<AppType>(bffServerConfig.baseUrl, {
    headers: options?.cookie ? { cookie: options.cookie } : undefined,
  });
};
