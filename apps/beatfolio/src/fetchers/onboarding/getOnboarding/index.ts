import type { InferResponseType } from "hono/client";
import { createBeatfolioBffServerClient } from "../../../utils/client/server";
import { type Result, ok, err } from "../../../utils/result";
import { type FetcherError, NETWORK_ERROR_MESSAGE } from "../../shared/error";

type BffClient = Awaited<ReturnType<typeof createBeatfolioBffServerClient>>;

export type OnboardingScreen = InferResponseType<
  BffClient["api"]["onboarding"]["$get"],
  200
>;

const FALLBACK_MESSAGE = "オンボーディング状態の取得に失敗しました";

export const getOnboarding = async (): Promise<
  Result<OnboardingScreen, FetcherError>
> => {
  try {
    const client = await createBeatfolioBffServerClient();
    const res = await client.api.onboarding.$get();

    if (!res.ok) {
      return err({ kind: "unexpected", message: FALLBACK_MESSAGE });
    }

    return ok(await res.json());
  } catch {
    return err({ kind: "unexpected", message: NETWORK_ERROR_MESSAGE });
  }
};
