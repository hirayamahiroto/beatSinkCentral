import { hc } from "hono/client";
import type { AppType as ApiServerAppType } from "./../../../../api-server/src/app/api/[[...route]]/route";
import type { AppType as BeatfolioBffAppType } from "../../app/api/[[...route]]/route";
import { apiServerConfig, beatfolioBffConfig } from "../config";

type ClientOptions = {
  cookie?: string;
};

export const createApiServerClient = (options?: ClientOptions) => {
  if (!apiServerConfig.baseUrl) {
    throw new Error("API_SERVER_BASE_URL is not set");
  }

  return hc<ApiServerAppType>(apiServerConfig.baseUrl, {
    headers: options?.cookie ? { cookie: options.cookie } : undefined,
  });
};

export const createBeatfolioBffServerClient = (options?: ClientOptions) => {
  if (!beatfolioBffConfig.baseUrl) {
    throw new Error("APP_BASE_URL is not set");
  }

  return hc<BeatfolioBffAppType>(beatfolioBffConfig.baseUrl, {
    headers: options?.cookie ? { cookie: options.cookie } : undefined,
  });
};

export const createBeatfolioBffClient = () => hc<BeatfolioBffAppType>("/");
