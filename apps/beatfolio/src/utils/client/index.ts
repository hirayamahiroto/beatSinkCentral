import { hc } from "hono/client";
import type { AppType as ApiServerAppType } from "./../../../../api-server/src/app/api/[[...route]]/route";
import type { AppType as BeatfolioBffAppType } from "../../app/api/[[...route]]/route";
import { apiServerConfig } from "../config";
import { createUpstreamUnavailableError } from "./errors/upstreamUnavailable";
import { throwBffError } from "../../errorMap";

type ClientOptions = {
  cookie?: string;
  userAgent?: string;
};

const upstreamFetch: typeof fetch = async (input, init) => {
  try {
    return await fetch(input, init);
  } catch (error) {
    throwBffError(createUpstreamUnavailableError(error));
  }
};

export const createApiServerClient = (options?: ClientOptions) => {
  if (!apiServerConfig.baseUrl) {
    throw new Error("API_SERVER_BASE_URL is not set");
  }

  const headers: Record<string, string> = {};
  if (options?.cookie) headers.cookie = options.cookie;
  if (options?.userAgent) headers["x-forwarded-user-agent"] = options.userAgent;

  return hc<ApiServerAppType>(apiServerConfig.baseUrl, {
    headers: Object.keys(headers).length > 0 ? headers : undefined,
    fetch: upstreamFetch,
  });
};

export const createBeatfolioBffClient = () => hc<BeatfolioBffAppType>("/");
