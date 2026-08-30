import { hc } from "hono/client";
import { headers } from "next/headers";
import type { AppType as BeatfolioBffAppType } from "../../../app/api/[[...route]]/route";
import { beatfolioBffConfig } from "../../config";

export const createBeatfolioBffServerClient = async () => {
  const cookie = (await headers()).get("cookie") ?? undefined;

  return hc<BeatfolioBffAppType>(beatfolioBffConfig.baseUrl, {
    headers: cookie ? { cookie } : undefined,
  });
};
