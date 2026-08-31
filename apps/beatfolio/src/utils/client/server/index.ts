import { hc } from "hono/client";
import { headers } from "next/headers";
import type { AppType as BeatfolioBffAppType } from "../../../app/api/[[...route]]/route";
import { beatfolioBffConfig } from "../../config";
import { createInsecureBffBaseUrlError } from "../errors/insecureBffBaseUrl";

const LOCAL_HOSTNAMES = ["localhost", "127.0.0.1", "[::1]"];

export const isCookieForwardableBaseUrl = (baseUrl: string): boolean => {
  let url: URL;
  try {
    url = new URL(baseUrl);
  } catch {
    return false;
  }
  return (
    url.protocol === "https:" ||
    (url.protocol === "http:" && LOCAL_HOSTNAMES.includes(url.hostname))
  );
};

const noRedirectFetch: typeof fetch = (input, init) =>
  fetch(input, { ...init, redirect: "manual" });

export const createBeatfolioBffServerClient = async () => {
  if (!isCookieForwardableBaseUrl(beatfolioBffConfig.baseUrl)) {
    throw createInsecureBffBaseUrlError();
  }

  const cookie = (await headers()).get("cookie") ?? undefined;

  return hc<BeatfolioBffAppType>(beatfolioBffConfig.baseUrl, {
    headers: cookie ? { cookie } : undefined,
    fetch: noRedirectFetch,
  });
};
