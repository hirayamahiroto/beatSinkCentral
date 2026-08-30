import type { InferResponseType } from "hono/client";
import { createBeatfolioBffServerClient } from "../../../utils/client/server";
import { type Result, ok, err } from "../../../utils/result";
import { type FetcherError, NETWORK_ERROR_MESSAGE } from "../../shared/error";

type BffClient = Awaited<ReturnType<typeof createBeatfolioBffServerClient>>;

export type ProfileEditScreen = InferResponseType<
  BffClient["api"]["dashboard"]["profile"]["edit"]["$get"],
  200
>;

const FALLBACK_MESSAGE = "プロフィール編集画面の取得に失敗しました";

export const getProfileEditScreen = async (): Promise<
  Result<ProfileEditScreen, FetcherError>
> => {
  try {
    const client = await createBeatfolioBffServerClient();
    const res = await client.api.dashboard.profile.edit.$get();

    if (!res.ok) {
      return err({ kind: "unexpected", message: FALLBACK_MESSAGE });
    }

    return ok(await res.json());
  } catch {
    return err({ kind: "unexpected", message: NETWORK_ERROR_MESSAGE });
  }
};
