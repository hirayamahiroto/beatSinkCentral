import type { InferResponseType } from "hono/client";
import { createBeatfolioBffServerClient } from "../../../utils/client/server";
import { type Result, ok, err } from "../../../utils/result";
import { type FetcherError, NETWORK_ERROR_MESSAGE } from "../../shared/error";

type BffClient = Awaited<ReturnType<typeof createBeatfolioBffServerClient>>;

export type ListPlayersScreen = InferResponseType<
  BffClient["api"]["players"]["$get"],
  200
>;

const FALLBACK_MESSAGE = "プレイヤー一覧の取得に失敗しました";

export const listPlayers = async (): Promise<
  Result<ListPlayersScreen, FetcherError>
> => {
  try {
    const client = await createBeatfolioBffServerClient();
    const res = await client.api.players.$get();

    if (!res.ok) {
      return err({ kind: "unexpected", message: FALLBACK_MESSAGE });
    }

    return ok(await res.json());
  } catch {
    return err({ kind: "unexpected", message: NETWORK_ERROR_MESSAGE });
  }
};
