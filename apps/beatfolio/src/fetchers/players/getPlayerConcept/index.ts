import type { InferResponseType } from "hono/client";
import { createBeatfolioBffServerClient } from "../../../utils/client/server";
import { type Result, ok, err } from "../../../utils/result";
import { type FetcherError, NETWORK_ERROR_MESSAGE } from "../../shared/error";

type BffClient = Awaited<ReturnType<typeof createBeatfolioBffServerClient>>;

export type PlayerConceptScreen = InferResponseType<
  BffClient["api"]["players"][":handle"]["concept"]["$get"],
  200
>;

const FALLBACK_MESSAGE = "コンセプトページの取得に失敗しました";
const NOT_FOUND_MESSAGE = "このプレイヤーは見つかりませんでした";

export const getPlayerConcept = async (input: {
  handle: string;
}): Promise<Result<PlayerConceptScreen, FetcherError>> => {
  try {
    const client = await createBeatfolioBffServerClient();
    const res = await client.api.players[":handle"].concept.$get({
      param: { handle: input.handle },
    });

    if (res.status === 404) {
      return err({ kind: "notFound", message: NOT_FOUND_MESSAGE });
    }

    if (!res.ok) {
      return err({ kind: "unexpected", message: FALLBACK_MESSAGE });
    }

    return ok(await res.json());
  } catch {
    return err({ kind: "unexpected", message: NETWORK_ERROR_MESSAGE });
  }
};
