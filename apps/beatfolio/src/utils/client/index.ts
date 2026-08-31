import { hc } from "hono/client";
import type { AppType as ApiServerAppType } from "./../../../../api-server/src/app/api/[[...route]]/route";
import type { AppType as BeatfolioBffAppType } from "../../app/api/[[...route]]/route";
import { apiServerConfig } from "../config";
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

export const createBeatfolioBffClient = () => hc<BeatfolioBffAppType>("/");
