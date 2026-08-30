import type { InferResponseType } from "hono/client";
import { createBeatfolioBffServerClient } from "../../../utils/client";
import { type Result, ok, err } from "../../../utils/result";
import {
  type FetcherError,
  toReadFetcherError,
  NETWORK_ERROR_MESSAGE,
} from "../../shared/error";

type BffClient = ReturnType<typeof createBeatfolioBffServerClient>;

export type DashboardScreen = InferResponseType<
  BffClient["api"]["dashboard"]["$get"],
  200
>;

const FALLBACK_MESSAGE = "ダッシュボードの取得に失敗しました";

export const getDashboard = async (options: {
  cookie?: string;
}): Promise<Result<DashboardScreen, FetcherError>> => {
  try {
    const client = createBeatfolioBffServerClient({ cookie: options.cookie });
    const res = await client.api.dashboard.$get();

    if (!res.ok) {
      return err(toReadFetcherError(res.status, FALLBACK_MESSAGE));
    }

    return ok(await res.json());
  } catch {
    return err({ kind: "unexpected", message: NETWORK_ERROR_MESSAGE });
  }
};
