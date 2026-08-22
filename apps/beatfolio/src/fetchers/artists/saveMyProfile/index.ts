import type { InferRequestType } from "hono/client";
import { createBeatfolioBffClient } from "../../../utils/client";
import { type Result, ok, err } from "../../../utils/result";
import {
  type FetcherError,
  toErrorKind,
  readErrorMessage,
  NETWORK_ERROR_MESSAGE,
} from "../../shared/error";

type BffClient = ReturnType<typeof createBeatfolioBffClient>;

export type SaveMyProfileInput = InferRequestType<
  BffClient["api"]["artists"]["me"]["profile"]["$post"]
>["json"];

const FALLBACK_MESSAGE = "プロフィールの保存に失敗しました";

export const saveMyProfile = async (
  input: SaveMyProfileInput,
): Promise<Result<void, FetcherError>> => {
  try {
    const client = createBeatfolioBffClient();
    const res = await client.api.artists.me.profile.$post({ json: input });

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
