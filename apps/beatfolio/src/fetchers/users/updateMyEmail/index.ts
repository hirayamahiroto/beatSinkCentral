import { createBeatfolioBffClient } from "../../../utils/client";
import { type Result, ok, err } from "../../../utils/result";
import {
  type FetcherError,
  toErrorKind,
  readErrorMessage,
  NETWORK_ERROR_MESSAGE,
} from "../../shared/error";

const FALLBACK_MESSAGE = "メールアドレスの更新に失敗しました";

export const updateMyEmail = async (input: {
  email: string;
}): Promise<Result<void, FetcherError>> => {
  try {
    const client = createBeatfolioBffClient();
    const res = await client.api.users.me.$post({ json: input });

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
