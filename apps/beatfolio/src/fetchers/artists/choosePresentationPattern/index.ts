import { createBeatfolioBffClient } from "../../../utils/client";
import { type Result, ok, err } from "../../../utils/result";
import {
  type FetcherError,
  toErrorKind,
  readErrorMessage,
  NETWORK_ERROR_MESSAGE,
} from "../../shared/error";

const FALLBACK_MESSAGE = "表現パターンの保存に失敗しました";

export const choosePresentationPattern = async (input: {
  patternCode: string;
}): Promise<Result<void, FetcherError>> => {
  try {
    const client = createBeatfolioBffClient();
    const res = await client.api.artists.me.presentation.$post({
      json: input,
    });

    if (!res.ok) {
      return err({
        kind: toErrorKind(res.status),
        message: await readErrorMessage(res, FALLBACK_MESSAGE),
      });
    }

    return ok(undefined);
  } catch {
    return err({ kind: "unexpected", message: NETWORK_ERROR_MESSAGE });
  }
};
