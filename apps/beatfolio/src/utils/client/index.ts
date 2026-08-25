import { hc } from "hono/client";
import type { AppType as ApiServerAppType } from "./../../../../api-server/src/app/api/[[...route]]/route";
import type { AppType as BeatfolioBffAppType } from "../../app/api/[[...route]]/route";
import { apiServerConfig, beatfolioBffConfig } from "../config";
import { createUpstreamUnavailableError } from "./errors/upstreamUnavailable";

type ClientOptions = {
  cookie?: string;
};

const upstreamFetch: typeof fetch = async (input, init) => {
  try {
    return await fetch(input, init);
  } catch (error) {
    throw createUpstreamUnavailableError(error);
  }
};

export const createApiServerClient = (options?: ClientOptions) => {
  if (!apiServerConfig.baseUrl) {
    throw new Error("API_SERVER_BASE_URL is not set");
  }

  return hc<ApiServerAppType>(apiServerConfig.baseUrl, {
    headers: options?.cookie ? { cookie: options.cookie } : undefined,
    fetch: upstreamFetch,
  });
};

export const createBeatfolioBffServerClient = (options?: ClientOptions) => {
  return hc<BeatfolioBffAppType>(beatfolioBffConfig.baseUrl, {
    headers: options?.cookie ? { cookie: options.cookie } : undefined,
  });
};

export const createBeatfolioBffClient = () => hc<BeatfolioBffAppType>("/");
